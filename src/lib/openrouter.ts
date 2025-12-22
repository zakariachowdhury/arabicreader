import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface OpenRouterMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface OpenRouterResponse {
    id: string;
    model: string;
    choices: Array<{
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

/**
 * Get OpenRouter configuration from database settings
 */
export async function getOpenRouterConfig() {
    try {
        const [apiKeySetting] = await db
            .select()
            .from(settings)
            .where(eq(settings.key, "openrouter.api_key"))
            .limit(1);

        const [supportedModelsSetting] = await db
            .select()
            .from(settings)
            .where(eq(settings.key, "openrouter.supported_models"))
            .limit(1);

        const [defaultModelSetting] = await db
            .select()
            .from(settings)
            .where(eq(settings.key, "openrouter.default_model"))
            .limit(1);

        if (!apiKeySetting) {
            return null;
        }

        return {
            apiKey: apiKeySetting.value,
            supportedModels: supportedModelsSetting?.value
                ? (JSON.parse(supportedModelsSetting.value) as string[])
                : [],
            defaultModel: defaultModelSetting?.value || null,
        };
    } catch (error) {
        console.error("Failed to fetch OpenRouter config:", error);
        return null;
    }
}

/**
 * Make a request to OpenRouter API
 */
export async function callOpenRouter(
    model: string,
    messages: OpenRouterMessage[],
    options?: {
        temperature?: number;
        max_tokens?: number;
        top_p?: number;
    }
): Promise<OpenRouterResponse> {
    const config = await getOpenRouterConfig();

    if (!config || !config.apiKey) {
        throw new Error("OpenRouter API key not configured. Please contact an administrator.");
    }

    // Validate model is in supported list
    if (config.supportedModels.length > 0 && !config.supportedModels.includes(model)) {
        throw new Error(`Model "${model}" is not in the list of supported models.`);
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": process.env.NEXT_PUBLIC_APP_NAME || "TaskFlow",
        },
        body: JSON.stringify({
            model,
            messages,
            ...options,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.error?.message || `OpenRouter API error: ${response.status} ${response.statusText}`
        );
    }

    return await response.json();
}

/**
 * Get the default model from settings
 */
export async function getDefaultModel(): Promise<string | null> {
    try {
        const config = await getOpenRouterConfig();
        return config?.defaultModel || null;
    } catch (error) {
        console.error("Failed to fetch default model:", error);
        return null;
    }
}

/**
 * Get list of available models from OpenRouter
 */
export async function getAvailableModels() {
    const config = await getOpenRouterConfig();

    if (!config || !config.apiKey) {
        throw new Error("OpenRouter API key not configured. Please contact an administrator.");
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error("Failed to fetch available models:", error);
        throw error;
    }
}

/**
 * Get available models for users (non-admin accessible)
 * Returns the list of supported models from settings
 */
export async function getAvailableModelsForUsers(): Promise<string[]> {
    try {
        const config = await getOpenRouterConfig();
        if (!config) {
            return [];
        }
        return config.supportedModels || [];
    } catch (error) {
        console.error("Failed to fetch available models for users:", error);
        return [];
    }
}

