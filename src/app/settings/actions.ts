"use server";

import { db } from "@/db";
import { settings } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

async function getSession() {
    return await auth.api.getSession({
        headers: await headers(),
    });
}

export async function checkIsAdmin() {
    try {
        await requireAdmin();
        return { isAdmin: true };
    } catch {
        return { isAdmin: false };
    }
}

/**
 * Generic function to get a setting value by key
 */
async function getSetting(key: string): Promise<string | null> {
    try {
        const [setting] = await db
            .select()
            .from(settings)
            .where(eq(settings.key, key))
            .limit(1);

        return setting?.value || null;
    } catch (error) {
        console.error(`Failed to fetch setting ${key}:`, error);
        return null;
    }
}

/**
 * Generic function to set a setting value by key
 */
async function setSetting(key: string, value: string, userId: string): Promise<void> {
    const existing = await db
        .select()
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);

    if (existing.length > 0) {
        await db
            .update(settings)
            .set({
                value,
                updatedAt: new Date(),
                updatedBy: userId,
            })
            .where(eq(settings.key, key));
    } else {
        await db.insert(settings).values({
            key,
            value,
            updatedAt: new Date(),
            updatedBy: userId,
        });
    }
}

export async function getOpenRouterConfig() {
    await requireAdmin();

    try {
        const apiKey = await getSetting("openrouter.api_key");
        const supportedModelsStr = await getSetting("openrouter.supported_models");
        const defaultModel = await getSetting("openrouter.default_model");

        return {
            apiKey: apiKey || "",
            supportedModels: supportedModelsStr ? (JSON.parse(supportedModelsStr) as string[]) : [],
            defaultModel: defaultModel || "",
        };
    } catch (error) {
        console.error("Failed to fetch OpenRouter config:", error);
        return {
            apiKey: "",
            supportedModels: [] as string[],
            defaultModel: "",
        };
    }
}

export async function updateOpenRouterConfig(data: { apiKey: string; supportedModels: string[]; defaultModel?: string }) {
    await requireAdmin();

    const session = await getSession();
    if (!session) {
        throw new Error("Unauthorized");
    }

    try {
        // Validate inputs
        if (!data.apiKey || data.apiKey.trim() === "") {
            throw new Error("API key is required");
        }

        if (!Array.isArray(data.supportedModels)) {
            throw new Error("Supported models must be an array");
        }

        // Validate default model is in supported models list (if provided)
        if (data.defaultModel && data.defaultModel.trim() !== "" && !data.supportedModels.includes(data.defaultModel)) {
            throw new Error("Default model must be one of the supported models");
        }

        // Update settings
        await setSetting("openrouter.api_key", data.apiKey, session.user.id);
        await setSetting("openrouter.supported_models", JSON.stringify(data.supportedModels), session.user.id);
        
        // Update default model (can be empty string to clear it)
        if (data.defaultModel !== undefined) {
            await setSetting("openrouter.default_model", data.defaultModel || "", session.user.id);
        }

        revalidatePath("/settings");
        return { error: null };
    } catch (error) {
        console.error("Failed to update OpenRouter config:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update OpenRouter configuration";
        return {
            error: {
                message: errorMessage,
            },
        };
    }
}

