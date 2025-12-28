"use server";

import { db } from "@/db";
import { settings, user } from "@/db/schema";
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

export async function getArabicFontSizeMultiplier(): Promise<number> {
    const session = await getSession();
    if (!session) {
        return 1.5; // Default value
    }

    try {
        const [userData] = await db
            .select({ arabicFontSizeMultiplier: user.arabicFontSizeMultiplier })
            .from(user)
            .where(eq(user.id, session.user.id))
            .limit(1);

        return userData?.arabicFontSizeMultiplier ?? 1.5;
    } catch (error) {
        console.error("Failed to fetch Arabic font size multiplier:", error);
        return 1.5; // Default value on error
    }
}

export async function updateArabicFontSizeMultiplier(multiplier: number) {
    const session = await getSession();
    if (!session) {
        throw new Error("Unauthorized");
    }

    // Clamp between 0.5 and 5
    const clamped = Math.max(0.5, Math.min(5, multiplier));

    try {
        await db
            .update(user)
            .set({
                arabicFontSizeMultiplier: clamped,
                updatedAt: new Date(),
            })
            .where(eq(user.id, session.user.id));

        revalidatePath("/settings");
        return { error: null };
    } catch (error) {
        console.error("Failed to update Arabic font size multiplier:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update Arabic font size";
        return {
            error: {
                message: errorMessage,
            },
        };
    }
}

export async function getEnglishFontSizeMultiplier(): Promise<number> {
    const session = await getSession();
    if (!session) {
        return 1.0; // Default value
    }

    try {
        const [userData] = await db
            .select({ englishFontSizeMultiplier: user.englishFontSizeMultiplier })
            .from(user)
            .where(eq(user.id, session.user.id))
            .limit(1);

        return userData?.englishFontSizeMultiplier ?? 1.0;
    } catch (error) {
        console.error("Failed to fetch English font size multiplier:", error);
        return 1.0; // Default value on error
    }
}

export async function updateEnglishFontSizeMultiplier(multiplier: number) {
    const session = await getSession();
    if (!session) {
        throw new Error("Unauthorized");
    }

    // Clamp between 0.5 and 5
    const clamped = Math.max(0.5, Math.min(5, multiplier));

    try {
        await db
            .update(user)
            .set({
                englishFontSizeMultiplier: clamped,
                updatedAt: new Date(),
            })
            .where(eq(user.id, session.user.id));

        revalidatePath("/settings");
        return { error: null };
    } catch (error) {
        console.error("Failed to update English font size multiplier:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update English font size";
        return {
            error: {
                message: errorMessage,
            },
        };
    }
}

export async function getArabicFontFamily(): Promise<string> {
    const session = await getSession();
    if (!session) {
        return "Scheherazade New"; // Default value
    }

    try {
        const [userData] = await db
            .select({ arabicFontFamily: user.arabicFontFamily })
            .from(user)
            .where(eq(user.id, session.user.id))
            .limit(1);

        return userData?.arabicFontFamily ?? "Scheherazade New";
    } catch (error) {
        console.error("Failed to fetch Arabic font family:", error);
        return "Scheherazade New"; // Default value on error
    }
}

export async function updateArabicFontFamily(fontFamily: string) {
    const session = await getSession();
    if (!session) {
        throw new Error("Unauthorized");
    }

    // Validate font family (allow only predefined fonts)
    const allowedFonts = ["Amiri", "Cairo", "Tajawal", "Noto Sans Arabic", "Scheherazade New", "Almarai", "Changa", "IBM Plex Sans Arabic", "El Messiri", "Markazi Text"];
    if (!allowedFonts.includes(fontFamily)) {
        throw new Error("Invalid font family");
    }

    try {
        await db
            .update(user)
            .set({
                arabicFontFamily: fontFamily,
                updatedAt: new Date(),
            })
            .where(eq(user.id, session.user.id));

        revalidatePath("/settings");
        return { error: null };
    } catch (error) {
        console.error("Failed to update Arabic font family:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update Arabic font family";
        return {
            error: {
                message: errorMessage,
            },
        };
    }
}

