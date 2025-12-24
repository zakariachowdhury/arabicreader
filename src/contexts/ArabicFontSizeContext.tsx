"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getArabicFontSizeMultiplier, updateArabicFontSizeMultiplier, getEnglishFontSizeMultiplier, updateEnglishFontSizeMultiplier } from "@/app/settings/actions";

interface FontSizeContextType {
    arabicFontSizeMultiplier: number;
    englishFontSizeMultiplier: number;
    setArabicFontSizeMultiplier: (multiplier: number) => void;
    setEnglishFontSizeMultiplier: (multiplier: number) => void;
    getArabicFontSize: (baseSize: string) => string;
    getEnglishFontSize: (baseSize: string) => string;
    isLoading: boolean;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

const DEFAULT_ARABIC_MULTIPLIER = 1.5; // Default to 1.5x larger for Arabic text
const DEFAULT_ENGLISH_MULTIPLIER = 1.0; // Default to 1.0x for English text

export function ArabicFontSizeProvider({ children }: { children: ReactNode }) {
    const [arabicFontSizeMultiplier, setArabicFontSizeMultiplierState] = useState<number>(DEFAULT_ARABIC_MULTIPLIER);
    const [englishFontSizeMultiplier, setEnglishFontSizeMultiplierState] = useState<number>(DEFAULT_ENGLISH_MULTIPLIER);
    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load from database on mount
    useEffect(() => {
        setIsMounted(true);
        async function loadFontSizes() {
            try {
                const [arabicMultiplier, englishMultiplier] = await Promise.all([
                    getArabicFontSizeMultiplier(),
                    getEnglishFontSizeMultiplier(),
                ]);
                setArabicFontSizeMultiplierState(arabicMultiplier);
                setEnglishFontSizeMultiplierState(englishMultiplier);
            } catch (error) {
                console.error("Failed to load font sizes:", error);
                // Keep default values on error
            } finally {
                setIsLoading(false);
            }
        }
        loadFontSizes();
    }, []);

    const setArabicFontSizeMultiplier = async (multiplier: number) => {
        // Clamp between 0.5x and 5x
        const clamped = Math.max(0.5, Math.min(5, multiplier));
        const previousValue = arabicFontSizeMultiplier;
        
        // Optimistically update UI
        setArabicFontSizeMultiplierState(clamped);
        
        // Save to database
        try {
            const result = await updateArabicFontSizeMultiplier(clamped);
            if (result.error) {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to save Arabic font size:", error);
            // Revert on error
            setArabicFontSizeMultiplierState(previousValue);
            throw error; // Re-throw so caller can handle it
        }
    };

    const setEnglishFontSizeMultiplier = async (multiplier: number) => {
        // Clamp between 0.5x and 5x
        const clamped = Math.max(0.5, Math.min(5, multiplier));
        const previousValue = englishFontSizeMultiplier;
        
        // Optimistically update UI
        setEnglishFontSizeMultiplierState(clamped);
        
        // Save to database
        try {
            const result = await updateEnglishFontSizeMultiplier(clamped);
            if (result.error) {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to save English font size:", error);
            // Revert on error
            setEnglishFontSizeMultiplierState(previousValue);
            throw error; // Re-throw so caller can handle it
        }
    };

    // Convert Tailwind text size classes to actual font sizes and apply multiplier
    const getFontSize = (baseSize: string, multiplier: number): string => {
        // Map Tailwind classes to rem values
        const sizeMap: Record<string, number> = {
            "text-xs": 0.75,
            "text-sm": 0.875,
            "text-base": 1,
            "text-lg": 1.125,
            "text-xl": 1.25,
            "text-2xl": 1.5,
            "text-3xl": 1.875,
            "text-4xl": 2.25,
            "text-5xl": 3,
            "text-6xl": 3.75,
            "text-7xl": 4.5,
        };

        // Extract the base size class
        const baseRem = sizeMap[baseSize] || 1;
        const multipliedRem = baseRem * multiplier;

        return `${multipliedRem}rem`;
    };

    const getArabicFontSize = (baseSize: string): string => {
        return getFontSize(baseSize, arabicFontSizeMultiplier);
    };

    const getEnglishFontSize = (baseSize: string): string => {
        return getFontSize(baseSize, englishFontSizeMultiplier);
    };

    // Always provide the context, even before mounted, to avoid errors
    // The default values will be used until the actual values are loaded
    return (
        <FontSizeContext.Provider
            value={{
                arabicFontSizeMultiplier,
                englishFontSizeMultiplier,
                setArabicFontSizeMultiplier,
                setEnglishFontSizeMultiplier,
                getArabicFontSize,
                getEnglishFontSize,
                isLoading,
            }}
        >
            {children}
        </FontSizeContext.Provider>
    );
}

export function useArabicFontSize() {
    const context = useContext(FontSizeContext);
    if (context === undefined) {
        throw new Error("useArabicFontSize must be used within an ArabicFontSizeProvider");
    }
    return context;
}

// Export a hook for English font size as well (for convenience)
export function useEnglishFontSize() {
    const context = useContext(FontSizeContext);
    if (context === undefined) {
        throw new Error("useEnglishFontSize must be used within an ArabicFontSizeProvider");
    }
    return {
        englishFontSizeMultiplier: context.englishFontSizeMultiplier,
        setEnglishFontSizeMultiplier: context.setEnglishFontSizeMultiplier,
        getEnglishFontSize: context.getEnglishFontSize,
        isLoading: context.isLoading,
    };
}

