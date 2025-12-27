/**
 * Shared utility for streaming chat messages
 */

export interface StreamMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export interface StreamOptions {
    model: string;
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    onChunk?: (content: string) => void;
    onMessage?: (message: string) => void; // Final message update (replaces streamed content)
    onComplete?: (fullContent: string) => void;
    onNavigationLinks?: (links: Array<{ label: string; url: string }>) => void;
    onError?: (error: Error) => void;
}

/**
 * Stream AI response from the chat API
 */
export async function streamChatResponse(options: StreamOptions): Promise<string> {
    const { model, messages, onChunk, onMessage, onComplete, onNavigationLinks, onError } = options;

    try {
        const response = await fetch("/api/chat/stream", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model,
                messages,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to get AI response");
        }

        if (!response.body) {
            throw new Error("Response body is null");
        }

        // Read the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                buffer += decoder.decode(value, { stream: true });

                // Process complete lines (SSE format)
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.trim() === "") continue;

                    if (line.startsWith("data: ")) {
                        const data = line.slice(6);

                        try {
                            const parsed = JSON.parse(data);

                            if (parsed.content) {
                                fullContent += parsed.content;
                                
                                // Call onChunk callback if provided
                                if (onChunk) {
                                    onChunk(parsed.content);
                                }
                            }

                            // Handle final message update (replaces streamed JSON with actual message)
                            if (parsed.message) {
                                // Replace the accumulated content with the extracted message
                                fullContent = parsed.message;
                                // Call onMessage callback to update the message content
                                if (onMessage) {
                                    onMessage(parsed.message);
                                }
                            }

                            // Handle navigation links
                            if (parsed.navigationLinks && Array.isArray(parsed.navigationLinks)) {
                                if (onNavigationLinks) {
                                    onNavigationLinks(parsed.navigationLinks);
                                }
                            }

                            if (parsed.done) {
                                break;
                            }
                        } catch (e) {
                            // Skip invalid JSON
                            console.error("Failed to parse SSE data:", e);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        // Call onComplete callback if provided
        if (onComplete) {
            onComplete(fullContent);
        }

        return fullContent;
    } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        if (onError) {
            onError(err);
        }
        throw err;
    }
}

