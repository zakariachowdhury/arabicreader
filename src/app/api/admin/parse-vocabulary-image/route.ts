import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getOpenRouterConfig } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ error: "No image file provided" }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 });
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");
        const mimeType = file.type;

        // Get OpenRouter config
        const config = await getOpenRouterConfig();
        if (!config || !config.apiKey) {
            return NextResponse.json(
                { error: "OpenRouter API key not configured" },
                { status: 500 }
            );
        }

        // Use a vision-capable model (default to gpt-4o or claude-3.5-sonnet if available)
        // Try to find a vision model in supported models, otherwise use a default
        const visionModels = [
            "openai/gpt-4o",
            "openai/gpt-4o-mini",
            "anthropic/claude-3.5-sonnet",
            "anthropic/claude-3-opus",
            "google/gemini-pro-vision",
        ];

        let model = visionModels[0]; // Default
        if (config.supportedModels.length > 0) {
            // Find first supported vision model
            const supportedVisionModel = visionModels.find((m) =>
                config.supportedModels.includes(m)
            );
            if (supportedVisionModel) {
                model = supportedVisionModel;
            }
        }

        // Prepare the vision message
        const messages = [
            {
                role: "user" as const,
                content: [
                    {
                        type: "text" as const,
                        text: `You are an expert in Arabic language education. Analyze this image of a vocabulary page from an Arabic textbook. Extract all Arabic-English word pairs from the page.

The image shows a vocabulary dictionary page with:
- Arabic words/phrases in one column
- English translations in another column
- Sometimes additional information like root forms or phonetic breakdowns

Please extract ALL word pairs and return them as a JSON array in this exact format:
[
  {
    "arabic": "الْعَرَبِيَّةُ",
    "english": "Arabic"
  },
  {
    "arabic": "الْإِنْجِلِيزِيَّةُ",
    "english": "English"
  }
]

Important:
- Extract only actual vocabulary word pairs (Arabic and English)
- Ignore headers, titles, page numbers, and other metadata
- If a word has multiple translations, use the primary/main translation
- Preserve Arabic diacritics (tashkeel) if present
- Return ONLY valid JSON, no additional text or explanation
- If you find no word pairs, return an empty array: []`,
                    },
                    {
                        type: "image_url" as const,
                        image_url: {
                            url: `data:${mimeType};base64,${base64Image}`,
                        },
                    },
                ],
            },
        ];

        // Call OpenRouter API
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
                temperature: 0.1, // Low temperature for more consistent extraction
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.error?.message || `OpenRouter API error: ${response.status} ${response.statusText}`
            );
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || "";

        // Parse the JSON response
        let wordPairs: Array<{ arabic: string; english: string }> = [];
        
        try {
            // Try to extract JSON from the response (in case there's extra text)
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                wordPairs = JSON.parse(jsonMatch[0]);
            } else {
                // Try parsing the whole content
                wordPairs = JSON.parse(content);
            }

            // Validate the structure
            if (!Array.isArray(wordPairs)) {
                throw new Error("Response is not an array");
            }

            // Filter and validate word pairs
            wordPairs = wordPairs
                .filter((pair) => pair.arabic && pair.english)
                .map((pair) => ({
                    arabic: String(pair.arabic).trim(),
                    english: String(pair.english).trim(),
                }))
                .filter((pair) => pair.arabic.length > 0 && pair.english.length > 0);
        } catch (parseError) {
            console.error("Failed to parse AI response:", parseError);
            console.error("Response content:", content);
            return NextResponse.json(
                {
                    error: "Failed to parse extracted word pairs. The AI response was not in the expected format.",
                    rawResponse: content,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            wordPairs,
            model: data.model || model,
        });
    } catch (error) {
        console.error("Error parsing vocabulary image:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to parse vocabulary image",
            },
            { status: 500 }
        );
    }
}

