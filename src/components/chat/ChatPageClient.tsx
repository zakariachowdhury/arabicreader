"use client";

import { useState, useEffect } from "react";
import { getChatSessionMessages, type ChatSession } from "@/app/actions";
import { ChatSidebar } from "./ChatSidebar";
import { ChatInterface } from "./ChatInterface";

interface ChatPageClientProps {
    initialSessions: ChatSession[];
}

export function ChatPageClient({ initialSessions }: ChatPageClientProps) {
    const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Array<{
        role: "user" | "assistant";
        content: string;
        createdAt: Date;
        navigationLinks?: Array<{ label: string; url: string }>;
    }>>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const handleNewChat = () => {
        setActiveSessionId(null);
        setMessages([]);
    };

    const handleSelectSession = async (sessionId: number) => {
        setActiveSessionId(sessionId);
        setIsLoadingMessages(true);
        try {
            const sessionMessages = await getChatSessionMessages(sessionId);
            setMessages(
                sessionMessages.map(msg => ({
                    role: msg.role as "user" | "assistant",
                    content: msg.content,
                    createdAt: msg.createdAt,
                    navigationLinks: msg.navigationLinks && Array.isArray(msg.navigationLinks)
                        ? msg.navigationLinks as Array<{ label: string; url: string }>
                        : undefined,
                }))
            );
        } catch (error) {
            console.error("Failed to load messages:", error);
            setMessages([]);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const handleSessionCreated = (sessionId: number) => {
        setActiveSessionId(sessionId);
        // Don't refresh router - session is already created and active
    };

    // Reload messages when chat-updated event is received (from floating chat or other instances)
    // Only reload if we're not currently loading messages (to avoid reloading our own messages)
    useEffect(() => {
        if (!activeSessionId) return;

        let reloadTimeout: NodeJS.Timeout | null = null;
        let lastReloadTime = 0;
        const DEBOUNCE_MS = 2000; // Don't reload more than once per 2 seconds
        let lastMessageSentTime = 0;

        const handleChatUpdate = async (e: CustomEvent) => {
            const eventSessionId = e.detail?.sessionId;
            const eventTimestamp = e.detail?.timestamp || Date.now();
            
            // Skip reload if we're currently loading (we already have the latest state)
            if (isLoadingMessages) {
                return;
            }
            
            // Skip if this event was triggered by us (within last 3 seconds)
            // This prevents reloading when we're the ones who sent the message
            if (Date.now() - lastMessageSentTime < 3000) {
                return;
            }
            
            // Only reload if it's the active session and we haven't reloaded recently
            if ((eventSessionId === activeSessionId || !eventSessionId)) {
                const now = Date.now();
                if (now - lastReloadTime < DEBOUNCE_MS) {
                    return; // Skip if we just reloaded
                }
                lastReloadTime = now;

                // Clear any pending reload
                if (reloadTimeout) {
                    clearTimeout(reloadTimeout);
                }

                // Debounce the reload slightly to avoid rapid successive reloads
                // Reload silently without showing loading state to avoid UI disruption
                reloadTimeout = setTimeout(async () => {
                    try {
                        // Don't set loading state - just update messages silently
                        const sessionMessages = await getChatSessionMessages(activeSessionId);
                        setMessages(
                            sessionMessages.map(msg => ({
                                role: msg.role as "user" | "assistant",
                                content: msg.content,
                                createdAt: msg.createdAt,
                                navigationLinks: msg.navigationLinks && Array.isArray(msg.navigationLinks)
                                    ? msg.navigationLinks as Array<{ label: string; url: string }>
                                    : undefined,
                            }))
                        );
                    } catch (error) {
                        console.error("Failed to reload messages:", error);
                    }
                }, 500);
            }
        };

        // Track when we send messages to avoid reloading our own updates
        const handleMessageSent = () => {
            lastMessageSentTime = Date.now();
        };

        window.addEventListener("chat-updated" as any, handleChatUpdate as EventListener);
        window.addEventListener("chat-message-sent" as any, handleMessageSent as EventListener);

        return () => {
            if (reloadTimeout) {
                clearTimeout(reloadTimeout);
            }
            window.removeEventListener("chat-updated" as any, handleChatUpdate as EventListener);
            window.removeEventListener("chat-message-sent" as any, handleMessageSent as EventListener);
        };
    }, [activeSessionId, isLoadingMessages]);

    return (
        <>
            <ChatSidebar
                activeSessionId={activeSessionId}
                onNewChat={handleNewChat}
                onSelectSession={handleSelectSession}
            />
            <div className="flex-1 flex flex-col min-w-0">
                {isLoadingMessages ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-slate-500">Loading messages...</div>
                    </div>
                ) : (
                    <ChatInterface
                        sessionId={activeSessionId}
                        initialMessages={messages}
                        onSessionCreated={handleSessionCreated}
                    />
                )}
            </div>
        </>
    );
}

