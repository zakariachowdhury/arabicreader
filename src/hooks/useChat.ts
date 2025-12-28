import { useState, useEffect, useCallback, useRef } from "react";
import { 
    getAvailableModelsForUsersAction, 
    getDefaultModelAction, 
    isAIAvailableForUser,
    getUserChatSessions,
    getChatSessionMessages,
    createChatSession,
    saveChatMessage,
    getChatHistoryLimit
} from "@/app/actions";
import type { ChatSession } from "@/db/schema";
import { streamChatResponse } from "@/lib/chat-stream";

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    navigationLinks?: Array<{ label: string; url: string }>;
}

export interface UseChatOptions {
    /**
     * Initial session ID to load messages from
     */
    initialSessionId?: number | null;
    /**
     * Initial messages to display
     */
    initialMessages?: Array<{
        role: "user" | "assistant";
        content: string;
        createdAt: Date;
        navigationLinks?: Array<{ label: string; url: string }>;
    }>;
    /**
     * Callback when a new session is created
     */
    onSessionCreated?: (sessionId: number) => void;
    /**
     * Whether to automatically load the last session on mount
     */
    autoLoadLastSession?: boolean;
}

export interface UseChatReturn {
    // State
    messages: ChatMessage[];
    input: string;
    isLoading: boolean;
    selectedModel: string;
    availableModels: string[];
    isLoadingModels: boolean;
    isAvailable: boolean;
    error: string | null;
    currentSessionId: number | null;
    isLoadingSession: boolean;
    
    // Actions
    setInput: (value: string) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    handleNewChat: () => void;
    loadSession: (sessionId: number) => Promise<void>;
    setCurrentSessionId: (sessionId: number | null) => void;
    setSelectedModel: (model: string) => void;
    setError: (error: string | null) => void;
    lastMessageSentTime: React.MutableRefObject<number>;
}

/**
 * Shared hook for chat functionality
 * Handles all backend logic: model loading, session management, message streaming
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
    const {
        initialSessionId = null,
        initialMessages = [],
        onSessionCreated,
        autoLoadLastSession = false,
    } = options;

    // State
    const [messages, setMessages] = useState<ChatMessage[]>(() => 
        initialMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.createdAt,
            navigationLinks: msg.navigationLinks && Array.isArray(msg.navigationLinks) && msg.navigationLinks.length > 0
                ? msg.navigationLinks as Array<{ label: string; url: string }>
                : undefined,
        }))
    );
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>("");
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(true);
    const [isAvailable, setIsAvailable] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(initialSessionId);
    const [isLoadingSession, setIsLoadingSession] = useState(false);
    const [chatHistoryLimit, setChatHistoryLimit] = useState<number>(10);
    const lastMessageSentTime = useRef<number>(0);
    const hasManuallyStartedNewChat = useRef<boolean>(false);
    const prevSessionIdRef = useRef<number | null>(initialSessionId);

    // Load models and check availability
    useEffect(() => {
        async function checkAvailabilityAndLoadModels() {
            try {
                setIsLoadingModels(true);
                
                const available = await isAIAvailableForUser();
                setIsAvailable(available);
                
                if (!available) {
                    setIsLoadingModels(false);
                    return;
                }
                
                // Load chat history limit
                const limit = await getChatHistoryLimit();
                setChatHistoryLimit(limit);
                
                const models = await getAvailableModelsForUsersAction();
                setAvailableModels(models);
                
                if (models.length > 0) {
                    // Try to get persisted model from localStorage, otherwise use default
                    const persistedModel = typeof window !== "undefined" 
                        ? localStorage.getItem("ai-chat-selected-model")
                        : null;
                    
                    if (persistedModel && models.includes(persistedModel)) {
                        setSelectedModel(persistedModel);
                    } else {
                        const defaultModel = await getDefaultModelAction();
                        if (defaultModel && models.includes(defaultModel)) {
                            setSelectedModel(defaultModel);
                        } else {
                            setSelectedModel(models[0]);
                        }
                    }
                } else {
                    setIsAvailable(false);
                }
            } catch (err) {
                console.error("Failed to load models:", err);
                setError("Failed to load available models");
                setIsAvailable(false);
            } finally {
                setIsLoadingModels(false);
            }
        }
        checkAvailabilityAndLoadModels();
    }, []);

    // Persist selected model to localStorage
    useEffect(() => {
        if (typeof window === "undefined" || !selectedModel) return;
        localStorage.setItem("ai-chat-selected-model", selectedModel);
    }, [selectedModel]);

    // Load session messages
    const loadSession = useCallback(async (sessionId: number) => {
        try {
            setIsLoadingSession(true);
            const sessionMessages = await getChatSessionMessages(sessionId);
            
            const chatMessages: ChatMessage[] = sessionMessages.map(msg => ({
                role: msg.role as "user" | "assistant",
                content: msg.content,
                timestamp: msg.createdAt,
                navigationLinks: msg.navigationLinks && Array.isArray(msg.navigationLinks) 
                    ? msg.navigationLinks as Array<{ label: string; url: string }>
                    : undefined,
            }));
            
            setMessages(chatMessages);
            setCurrentSessionId(sessionId);
        } catch (error) {
            console.error("Failed to load session:", error);
            setMessages([]);
            setCurrentSessionId(null);
        } finally {
            setIsLoadingSession(false);
        }
    }, []);

    // Auto-load last session if requested (only on initial mount, not after manual new chat)
    useEffect(() => {
        if (autoLoadLastSession && !isLoadingModels && isAvailable && !currentSessionId && messages.length === 0 && !hasManuallyStartedNewChat.current) {
            async function loadLastSession() {
                try {
                    setIsLoadingSession(true);
                    const sessions = await getUserChatSessions();
                    
                    if (sessions.length > 0) {
                        const lastSession = sessions[0];
                        await loadSession(lastSession.id);
                    }
                } catch (error) {
                    console.error("Failed to load last session:", error);
                } finally {
                    setIsLoadingSession(false);
                }
            }
            loadLastSession();
        }
    }, [autoLoadLastSession, isLoadingModels, isAvailable, currentSessionId, messages.length, loadSession]);

    // Update messages when initialMessages change (only if they have content)
    useEffect(() => {
        if (initialMessages.length > 0) {
            setMessages(
                initialMessages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.createdAt,
                    navigationLinks: msg.navigationLinks && Array.isArray(msg.navigationLinks) && msg.navigationLinks.length > 0
                        ? msg.navigationLinks as Array<{ label: string; url: string }>
                        : undefined,
                }))
            );
        }
        // Don't clear messages here - that's handled by the session ID effect to avoid infinite loops
    }, [initialMessages]);

    // Update session ID when prop changes
    useEffect(() => {
        if (initialSessionId !== undefined) {
            const prevSessionId = prevSessionIdRef.current;
            prevSessionIdRef.current = initialSessionId;
            setCurrentSessionId(initialSessionId);
            // Clear messages when session ID becomes null (new chat), but only if it actually changed
            if (initialSessionId === null && prevSessionId !== null) {
                setMessages([]);
                setError(null);
            }
        }
    }, [initialSessionId]);

    // Handle starting a new chat session
    const handleNewChat = useCallback(() => {
        hasManuallyStartedNewChat.current = true;
        setCurrentSessionId(null);
        setMessages([]);
        setError(null);
    }, []);

    // Handle message submission
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!input.trim() || !selectedModel || isLoading) return;

        const userPrompt = input.trim();
        const userMessage: ChatMessage = {
            role: "user",
            content: userPrompt,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setError(null);

        let sessionIdToUse = currentSessionId;

        try {
            // Create session if it doesn't exist
            if (!sessionIdToUse) {
                sessionIdToUse = await createChatSession(userPrompt);
                if (sessionIdToUse) {
                    setCurrentSessionId(sessionIdToUse);
                    // Reset the flag since we now have an active session
                    hasManuallyStartedNewChat.current = false;
                    if (onSessionCreated) {
                        onSessionCreated(sessionIdToUse);
                    }
                }
            }

            // Save user message to database
            if (sessionIdToUse) {
                await saveChatMessage(sessionIdToUse, "user", userPrompt);
                
                // Track when we sent a message to avoid reloading our own updates
                lastMessageSentTime.current = Date.now();
                
                // Dispatch custom event to notify other chat instances
                // Also dispatch a message-sent event to prevent reloads
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("chat-message-sent", {
                        detail: { sessionId: sessionIdToUse, timestamp: Date.now() }
                    }));
                    window.dispatchEvent(new CustomEvent("chat-updated", {
                        detail: { sessionId: sessionIdToUse, timestamp: Date.now() }
                    }));
                }
            }

            // Build conversation history for API, limiting to last N messages
            // Take the last chatHistoryLimit messages (excluding the current user prompt)
            const limitedMessages = messages.length > chatHistoryLimit 
                ? messages.slice(-chatHistoryLimit)
                : messages;

            // Build messages array for API
            const apiMessages = limitedMessages.map(msg => ({
                role: msg.role,
                content: msg.content,
            }));
            apiMessages.push({ role: "user", content: userPrompt });

            // Use shared streaming utility
            let messageCreated = false;
            let messageIndex = -1;
            let fullContent = "";
            let navigationLinks: Array<{ label: string; url: string }> = [];

            await streamChatResponse({
                model: selectedModel,
                messages: apiMessages,
                onChunk: (chunk) => {
                    fullContent += chunk;
                    
                    // Create assistant message only when we receive first content
                    if (!messageCreated) {
                        const assistantMessage: ChatMessage = {
                            role: "assistant",
                            content: fullContent,
                            timestamp: new Date(),
                            navigationLinks: undefined, // Will be set when navigation links are received
                        };
                        setMessages(prev => {
                            const newMessages = [...prev, assistantMessage];
                            messageIndex = newMessages.length - 1;
                            return newMessages;
                        });
                        messageCreated = true;
                    } else {
                        // Update the assistant message with streaming content
                        setMessages(prev => {
                            const updated = [...prev];
                            if (updated[messageIndex]) {
                                updated[messageIndex] = {
                                    ...updated[messageIndex],
                                    content: fullContent,
                                    navigationLinks: navigationLinks.length > 0 ? navigationLinks : undefined,
                                };
                            }
                            return updated;
                        });
                    }
                },
                onMessage: (message) => {
                    // Final message update (replaces streamed JSON with actual message)
                    fullContent = message;
                    if (messageCreated) {
                        setMessages(prev => {
                            const updated = [...prev];
                            if (updated[messageIndex]) {
                                // Preserve existing navigation links or use current navigationLinks
                                const existingLinks = updated[messageIndex].navigationLinks;
                                const linksToUse = existingLinks && existingLinks.length > 0 
                                    ? existingLinks 
                                    : (navigationLinks.length > 0 ? navigationLinks : undefined);
                                
                                updated[messageIndex] = {
                                    ...updated[messageIndex],
                                    content: message,
                                    navigationLinks: linksToUse,
                                };
                            }
                            return updated;
                        });
                    }
                },
                onNavigationLinks: (links) => {
                    // Validate and store navigation links
                    if (links && Array.isArray(links) && links.length > 0) {
                        // Validate that all links have required properties
                        const validLinks = links.filter(link => 
                            link && 
                            typeof link === 'object' && 
                            typeof link.label === 'string' && 
                            typeof link.url === 'string' &&
                            link.label.trim() !== '' &&
                            link.url.trim() !== ''
                        );
                        if (validLinks.length > 0) {
                            navigationLinks = validLinks;
                            // Update the assistant message with navigation links
                            if (messageCreated) {
                                setMessages(prev => {
                                    const updated = [...prev];
                                    if (updated[messageIndex]) {
                                        updated[messageIndex] = {
                                            ...updated[messageIndex],
                                            navigationLinks: validLinks,
                                        };
                                    }
                                    return updated;
                                });
                            }
                        }
                    }
                },
                onComplete: async (content) => {
                    // Use the final content (might have been updated by onMessage)
                    const finalContent = fullContent || content;
                    // Update message with final content and navigation links
                    if (messageCreated) {
                        setMessages(prev => {
                            const updated = [...prev];
                            if (updated[messageIndex]) {
                                updated[messageIndex] = {
                                    ...updated[messageIndex],
                                    content: finalContent,
                                    // Preserve navigation links if they exist
                                    navigationLinks: updated[messageIndex].navigationLinks || (navigationLinks.length > 0 ? navigationLinks : undefined),
                                };
                            }
                            return updated;
                        });
                    }
                    // Save complete assistant message to database only if we have content
                    if (sessionIdToUse && finalContent.trim()) {
                        const finalNavigationLinks = navigationLinks.length > 0 ? navigationLinks : undefined;
                        await saveChatMessage(sessionIdToUse, "assistant", finalContent, finalNavigationLinks);
                        
                        // Track when we sent a message to avoid reloading our own updates
                        lastMessageSentTime.current = Date.now();
                        
                        // Dispatch custom event to notify other chat instances
                        // Also dispatch a message-sent event to prevent reloads
                        if (typeof window !== "undefined") {
                            window.dispatchEvent(new CustomEvent("chat-message-sent", {
                                detail: { sessionId: sessionIdToUse, timestamp: Date.now() }
                            }));
                            window.dispatchEvent(new CustomEvent("chat-updated", {
                                detail: { sessionId: sessionIdToUse, timestamp: Date.now() }
                            }));
                        }
                    }
                },
                onError: (error) => {
                    throw error;
                },
            });

            // Remove empty message if no content was received
            if (messageCreated && !fullContent.trim()) {
                setMessages(prev => prev.filter((_, idx) => idx !== messageIndex));
            }
            
            // Don't refresh router - we're managing state locally, no need for full page reload
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to process request";
            setError(errorMessage);
            
            // Remove any empty assistant message if error occurred
            setMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage && lastMessage.role === "assistant" && (!lastMessage.content || lastMessage.content.trim() === "")) {
                    return prev.slice(0, -1);
                }
                return prev;
            });

            const assistantMessage: ChatMessage = {
                role: "assistant",
                content: `Sorry, I encountered an error: ${errorMessage}`,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [input, selectedModel, isLoading, currentSessionId, messages, onSessionCreated]);

    return {
        // State
        messages,
        input,
        isLoading,
        selectedModel,
        availableModels,
        isLoadingModels,
        isAvailable,
        error,
        currentSessionId,
        isLoadingSession,
        
        // Actions
        setInput,
        handleSubmit,
        handleNewChat,
        loadSession,
        setCurrentSessionId,
        setSelectedModel,
        setError,
        lastMessageSentTime,
    };
}

