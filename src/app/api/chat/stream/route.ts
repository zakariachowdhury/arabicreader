import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { callOpenRouterStream } from "@/lib/openrouter";
import { isAIAvailableForUser, getBooks, getAllBooksProgress, getUnitsByBook, getLessonsByUnit, getVocabularyWordsByLesson, getLessonProgress, getLessonById, getUnitById, getBookById } from "@/app/actions";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Check if AI is available for this user
        const aiAvailable = await isAIAvailableForUser();
        if (!aiAvailable) {
            return new Response(JSON.stringify({ error: "AI features are currently disabled" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }

        const body = await request.json();
        const { model, messages: userMessages, mode = "chat" } = body;

        if (!model || !userMessages || !Array.isArray(userMessages)) {
            return new Response(JSON.stringify({ error: "Invalid request: model and messages are required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Get learning data for context
        const [allBooks, allBooksProgress] = await Promise.all([
            getBooks(),
            getAllBooksProgress(),
        ]);

        // Build learning structure context (simplified for chat)
        // Also build a mapping for link validation
        let learningContext = "Available learning content:\n";
        const vocabularyWordsList: Array<{ arabic: string; english: string; lessonId: number; bookTitle: string; unitTitle: string; lessonTitle: string }> = [];
        const lessonMap = new Map<string, { id: number; type: string; unitId: number; bookId: number }>(); // title -> lesson info
        const unitMap = new Map<string, { id: number; bookId: number }>(); // title -> unit info
        const bookMap = new Map<string, number>(); // title -> book id

        for (const book of allBooks.slice(0, 3)) { // Limit to first 3 books to avoid token overflow
            const progress = allBooksProgress[book.id] || {
                totalWords: 0,
                wordsSeen: 0,
                wordsMastered: 0,
                completionPercentage: 0,
                lastActivityDate: null,
            };

            bookMap.set(book.title.toLowerCase(), book.id);
            learningContext += `\nBook ID ${book.id}: "${book.title}"${book.description ? ` - ${book.description}` : ""}\n`;
            learningContext += `  Progress: ${progress.wordsSeen}/${progress.totalWords} words seen, ${progress.completionPercentage.toFixed(0)}% complete\n`;

            const units = await getUnitsByBook(book.id);
            for (const unit of units.slice(0, 5)) { // Limit units
                unitMap.set(unit.title.toLowerCase(), { id: unit.id, bookId: book.id });
                learningContext += `  Unit ID ${unit.id}: "${unit.title}"\n`;

                const lessons = await getLessonsByUnit(unit.id);
                for (const lesson of lessons.slice(0, 5)) { // Limit lessons
                    lessonMap.set(lesson.title.toLowerCase(), { id: lesson.id, type: lesson.type, unitId: unit.id, bookId: book.id });
                    learningContext += `    Lesson ID ${lesson.id}: "${lesson.title}" (type: ${lesson.type})\n`;

                    if (lesson.type === "vocabulary") {
                        const words = await getVocabularyWordsByLesson(lesson.id);
                        const lessonProgress = await getLessonProgress(lesson.id);
                        learningContext += `      ${words.length} words (${lessonProgress.wordsSeen} seen, ${lessonProgress.wordsMastered} mastered)\n`;

                        // Add words to vocabulary list (limit to avoid token overflow)
                        words.slice(0, 20).forEach(word => {
                            vocabularyWordsList.push({
                                arabic: word.arabic,
                                english: word.english,
                                lessonId: lesson.id,
                                bookTitle: book.title,
                                unitTitle: unit.title,
                                lessonTitle: lesson.title,
                            });
                        });
                    }
                }
            }
        }

        // Build vocabulary context
        const vocabularyContext = vocabularyWordsList.length > 0
            ? `\n\nSample vocabulary words:\n${vocabularyWordsList.slice(0, 50).map((w, i) => `${i + 1}. "${w.arabic}" = "${w.english}" (Lesson: ${w.lessonTitle})`).join("\n")}`
            : "\n\nNo vocabulary words available yet.";

        // Get user's progress summary
        const progressSummary = Object.entries(allBooksProgress)
            .slice(0, 3)
            .map(([bookId, progress]) => {
                const book = allBooks.find(b => b.id === parseInt(bookId));
                return book ? `"${book.title}": ${progress.wordsSeen}/${progress.totalWords} words seen, ${progress.completionPercentage.toFixed(0)}% complete` : "";
            })
            .filter(Boolean)
            .join("\n");

        // Build system prompt that requests JSON with navigation links
        const systemPrompt = `You are a helpful AI assistant for an Arabic learning platform. Help users learn Arabic vocabulary, answer questions, and guide their learning journey.

${learningContext}${vocabularyContext}

User's Progress:
${progressSummary || "No progress data available yet."}

You can help users with:
- Answering questions about Arabic vocabulary, grammar, or concepts
- Explaining words and their meanings
- Suggesting what to study next based on their progress
- Providing learning tips and practice suggestions
- Helping navigate the learning content

IMPORTANT: When suggesting lessons, practice, or helping users navigate, ALWAYS include navigation links in your response.

Respond in JSON format:
{
  "message": "Your conversational response here (markdown supported)",
  "navigationLinks": [
    {"label": "Display text", "url": "/lessons/123/vocabulary"}
  ]
}

For navigation links, use these URL patterns with the ACTUAL IDs from the content above:
- Books: /books/{bookId} (use the Book ID shown above, e.g., /books/1)
- Units: /units/{unitId} (use the Unit ID shown above, e.g., /units/5)
- Lessons: 
  - /lessons/{lessonId}/vocabulary (for vocabulary type lessons - use the Lesson ID shown above)
  - /lessons/{lessonId}/reading (for reading type lessons - use the Lesson ID shown above)
  - /lessons/{lessonId}/conversation (for conversation type lessons - use the Lesson ID shown above)
  - /lessons/{lessonId}/practice (practice mode, only for vocabulary lessons - use the Lesson ID shown above)
  - /lessons/{lessonId}/test (test mode, only for vocabulary lessons - use the Lesson ID shown above)

CRITICAL: Always use the exact IDs shown in the content structure above. Do NOT make up IDs. Match lesson titles to their IDs from the structure.

ALWAYS include navigation links when:
- Suggesting specific lessons to practice
- Recommending what to study next
- Answering questions about progress (link to relevant lessons)
- Helping users continue their learning

Respond naturally and conversationally in the message field. Be helpful, encouraging, and educational. Reference the vocabulary and learning structure above when relevant.`;

        // Build messages array with system prompt
        const messages = [
            { role: "system" as const, content: systemPrompt },
            ...userMessages,
        ];

        // Create a streaming response
        const stream = await callOpenRouterStream(model, messages, {
            temperature: 0.7,
            max_tokens: 3000,
        });

        // Create a readable stream that processes the OpenRouter stream
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const readableStream = new ReadableStream({
            async start(controller) {
                const reader = stream.getReader();
                let buffer = "";
                let fullResponse = "";

                try {
                    while (true) {
                        const { done, value } = await reader.read();

                        if (done) {
                            break;
                        }

                        // Decode the chunk
                        buffer += decoder.decode(value, { stream: true });

                        // Process complete lines (SSE format)
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || ""; // Keep incomplete line in buffer

                        for (const line of lines) {
                            if (line.trim() === "") continue;

                            // SSE format: "data: {...}"
                            if (line.startsWith("data: ")) {
                                const data = line.slice(6);

                                if (data === "[DONE]") {
                                    // Stream is done, parse full response for navigation links
                                    await parseAndSendNavigationLinks(fullResponse, controller, encoder);
                                    controller.close();
                                    return;
                                }

                                try {
                                    const parsed = JSON.parse(data);
                                    const content = parsed.choices?.[0]?.delta?.content || "";

                                    if (content) {
                                        fullResponse += content;
                                        // Try to extract message content from JSON as we stream
                                        // If the response is JSON, we need to extract just the message field
                                        const extractedContent = extractMessageFromJsonStream(fullResponse, content);
                                        // Send the content chunk
                                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: extractedContent })}\n\n`));
                                    }

                                    // Check if finished
                                    if (parsed.choices?.[0]?.finish_reason) {
                                        // Stream is done, parse full response for navigation links
                                        await parseAndSendNavigationLinks(fullResponse, controller, encoder);
                                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                                        controller.close();
                                        return;
                                    }
                                } catch (e) {
                                    // Skip invalid JSON
                                    console.error("Failed to parse SSE data:", e);
                                }
                            }
                        }
                    }

                    // Process remaining buffer if stream ended
                    if (buffer.trim()) {
                        const lines = buffer.split("\n");
                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                const data = line.slice(6);
                                if (data !== "[DONE]") {
                                    try {
                                        const parsed = JSON.parse(data);
                                        const content = parsed.choices?.[0]?.delta?.content || "";
                                        if (content) {
                                            fullResponse += content;
                                            const extractedContent = extractMessageFromJsonStream(fullResponse, content);
                                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: extractedContent })}\n\n`));
                                        }
                                    } catch (e) {
                                        // Skip invalid JSON
                                    }
                                }
                            }
                        }
                    }

                    // Parse and send navigation links after stream completes
                    await parseAndSendNavigationLinks(fullResponse, controller, encoder);
                    controller.close();
                } catch (error) {
                    console.error("Stream error:", error);
                    controller.error(error);
                } finally {
                    reader.releaseLock();
                }
            },
        });

        // Helper function to extract message content from JSON stream
        // This tries to extract just the message field content as we stream
        function extractMessageFromJsonStream(fullResponse: string, newChunk: string): string {
            // For now, just return the chunk as-is
            // We'll parse the full JSON at the end and extract the message
            // This means users might see some JSON during streaming, but it will be corrected
            return newChunk;
        }

        // Helper function to validate and correct navigation links
        async function validateAndCorrectLinks(links: Array<{ label: string; url: string }>): Promise<Array<{ label: string; url: string }>> {
            const validatedLinks: Array<{ label: string; url: string }> = [];

            for (const link of links) {
                if (!link.label || !link.url || typeof link.label !== "string" || typeof link.url !== "string") {
                    continue;
                }

                let correctedUrl = link.url;

                // Validate and correct lesson links
                const lessonMatch = link.url.match(/^\/lessons\/(\d+)\/(vocabulary|reading|conversation|practice|test)$/);
                if (lessonMatch) {
                    const lessonId = parseInt(lessonMatch[1]);
                    const urlType = lessonMatch[2];
                    const lesson = await getLessonById(lessonId);
                    
                    if (lesson) {
                        // Validate lesson type matches the URL path
                        if (urlType === "practice" || urlType === "test") {
                            // Practice and test are only for vocabulary lessons
                            if (lesson.type !== "vocabulary") {
                                // Skip invalid practice/test link for non-vocabulary lesson
                                continue;
                            }
                            // URL is valid for vocabulary lesson
                            validatedLinks.push({ label: link.label, url: link.url });
                        } else if (urlType === "vocabulary") {
                            // Vocabulary URL - check if lesson is actually vocabulary
                            if (lesson.type === "vocabulary") {
                                validatedLinks.push({ label: link.label, url: link.url });
                            } else {
                                // Correct to the actual lesson type
                                correctedUrl = `/lessons/${lessonId}/${lesson.type}`;
                                validatedLinks.push({ label: link.label, url: correctedUrl });
                            }
                        } else if (urlType === lesson.type) {
                            // URL type matches lesson type (reading or conversation)
                            validatedLinks.push({ label: link.label, url: link.url });
                        } else {
                            // URL type doesn't match lesson type, correct it
                            correctedUrl = `/lessons/${lessonId}/${lesson.type}`;
                            validatedLinks.push({ label: link.label, url: correctedUrl });
                        }
                    } else {
                        // Lesson ID doesn't exist, try to find by label
                        const lessonInfo = lessonMap.get(link.label.toLowerCase());
                        if (lessonInfo) {
                            if (urlType === "practice" || urlType === "test") {
                                // Practice/test only for vocabulary
                                if (lessonInfo.type === "vocabulary") {
                                    correctedUrl = `/lessons/${lessonInfo.id}/${urlType}`;
                                    validatedLinks.push({ label: link.label, url: correctedUrl });
                                }
                            } else {
                                // Use the actual lesson type
                                correctedUrl = `/lessons/${lessonInfo.id}/${lessonInfo.type}`;
                                validatedLinks.push({ label: link.label, url: correctedUrl });
                            }
                        }
                    }
                }
                // Validate unit links
                else if (link.url.match(/^\/units\/(\d+)$/)) {
                    const unitId = parseInt(link.url.match(/^\/units\/(\d+)$/)![1]);
                    const unit = await getUnitById(unitId);
                    if (unit) {
                        validatedLinks.push({ label: link.label, url: link.url });
                    } else {
                        // Try to find by label
                        const unitInfo = unitMap.get(link.label.toLowerCase());
                        if (unitInfo) {
                            validatedLinks.push({ label: link.label, url: `/units/${unitInfo.id}` });
                        }
                    }
                }
                // Validate book links
                else if (link.url.match(/^\/books\/(\d+)$/)) {
                    const bookId = parseInt(link.url.match(/^\/books\/(\d+)$/)![1]);
                    const book = await getBookById(bookId);
                    if (book) {
                        validatedLinks.push({ label: link.label, url: link.url });
                    } else {
                        // Try to find by label
                        const bookIdFromMap = bookMap.get(link.label.toLowerCase());
                        if (bookIdFromMap) {
                            validatedLinks.push({ label: link.label, url: `/books/${bookIdFromMap}` });
                        }
                    }
                }
                // Keep other valid internal links
                else if (link.url.startsWith("/")) {
                    validatedLinks.push({ label: link.label, url: link.url });
                }
            }

            return validatedLinks;
        }

        // Helper function to parse JSON response and extract navigation links and message
        async function parseAndSendNavigationLinks(fullResponse: string, controller: ReadableStreamDefaultController, encoder: TextEncoder) {
            if (!fullResponse.trim()) return;

            try {
                // Try to parse as JSON
                let cleanedContent = fullResponse.trim();
                // Remove markdown code blocks if present
                cleanedContent = cleanedContent.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");
                cleanedContent = cleanedContent.replace(/\s*```\s*$/i, "");

                // Try to find JSON object
                const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const jsonString = jsonMatch[0];
                    try {
                        // Fix incomplete JSON if needed
                        let fixedJson = jsonString;
                        const openBraces = (jsonString.match(/\{/g) || []).length;
                        const closeBraces = (jsonString.match(/\}/g) || []).length;
                        const missingBraces = openBraces - closeBraces;
                        if (missingBraces > 0) {
                            fixedJson = fixedJson + "}".repeat(missingBraces);
                        }

                        const parsed = JSON.parse(fixedJson);
                        
                        // Extract message if present and send final message update
                        if (parsed.message && typeof parsed.message === "string") {
                            // Send the final message content (this will replace any JSON that was streamed)
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ message: parsed.message })}\n\n`));
                        }
                        
                        // Extract navigation links if present
                        if (parsed.navigationLinks && Array.isArray(parsed.navigationLinks)) {
                            // Validate and correct navigation links
                            const validatedLinks = await validateAndCorrectLinks(parsed.navigationLinks);
                            if (validatedLinks.length > 0) {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ navigationLinks: validatedLinks })}\n\n`));
                            }
                        }
                    } catch (e) {
                        // JSON parse failed, try to extract links from text
                        await extractLinksFromText(fullResponse, controller, encoder);
                    }
                } else {
                    // No JSON found, try to extract links from markdown/text
                    await extractLinksFromText(fullResponse, controller, encoder);
                }
            } catch (error) {
                console.error("Failed to parse navigation links:", error);
            }
        }

        // Helper function to extract navigation links from markdown/text
        async function extractLinksFromText(text: string, controller: ReadableStreamDefaultController, encoder: TextEncoder) {
            const links: Array<{ label: string; url: string }> = [];
            
            // Extract markdown links [label](url)
            const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
            let linkMatch;
            while ((linkMatch = linkPattern.exec(text)) !== null) {
                const url = linkMatch[2];
                // Only include internal links (starting with /)
                if (url.startsWith("/")) {
                    links.push({
                        label: linkMatch[1],
                        url: url,
                    });
                }
            }

            if (links.length > 0) {
                // Validate and correct the extracted links
                const validatedLinks = await validateAndCorrectLinks(links);
                if (validatedLinks.length > 0) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ navigationLinks: validatedLinks })}\n\n`));
                }
            }
        }

        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        console.error("Stream route error:", error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Internal server error",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}

