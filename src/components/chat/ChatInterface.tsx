"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Bot, Settings, AlertCircle, X } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { useChat } from "@/hooks/useChat";

interface ChatInterfaceProps {
    sessionId: number | null;
    initialMessages?: Array<{
        role: "user" | "assistant";
        content: string;
        createdAt: Date;
        navigationLinks?: Array<{ label: string; url: string }>;
    }>;
    onSessionCreated?: (sessionId: number) => void;
}

export function ChatInterface({ sessionId, initialMessages = [], onSessionCreated }: ChatInterfaceProps) {
    const [showModelSettings, setShowModelSettings] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Use shared chat hook for all backend logic
    const {
        messages,
        input,
        isLoading,
        selectedModel,
        availableModels,
        isLoadingModels,
        isAvailable,
        error,
        currentSessionId,
        loadSession,
        lastMessageSentTime,
        setInput,
        handleSubmit,
        setSelectedModel,
        setError,
    } = useChat({
        initialSessionId: sessionId,
        initialMessages,
        onSessionCreated,
    });

    // Reload session when chat-updated event is received (from floating chat or other instances)
    // Only reload if we're not currently processing a message (to avoid reloading our own messages)
    useEffect(() => {
        if (!currentSessionId) return;

        let reloadTimeout: NodeJS.Timeout | null = null;
        let lastReloadTime = 0;
        const DEBOUNCE_MS = 2000; // Don't reload more than once per 2 seconds

        const handleChatUpdate = (e: CustomEvent) => {
            const eventSessionId = e.detail?.sessionId;
            const now = Date.now();
            
            // Skip reload if we just sent a message ourselves (within last 3 seconds)
            // This prevents reloading when we're the ones who triggered the event
            if (now - lastMessageSentTime.current < 3000) {
                return;
            }
            
            // Skip reload if we're currently loading/processing (we already have the latest state)
            if (isLoading) {
                return;
            }
            
            // Only reload if it's the current session and we haven't reloaded recently
            if ((eventSessionId === currentSessionId || !eventSessionId)) {
                if (now - lastReloadTime < DEBOUNCE_MS) {
                    return; // Skip if we just reloaded
                }
                lastReloadTime = now;

                // Clear any pending reload
                if (reloadTimeout) {
                    clearTimeout(reloadTimeout);
                }

                // Debounce the reload slightly to avoid rapid successive reloads
                // Only reload if this is from another instance (not our own message)
                reloadTimeout = setTimeout(() => {
                    loadSession(currentSessionId);
                }, 500);
            }
        };

        window.addEventListener("chat-updated" as any, handleChatUpdate as EventListener);

        return () => {
            if (reloadTimeout) {
                clearTimeout(reloadTimeout);
            }
            window.removeEventListener("chat-updated" as any, handleChatUpdate as EventListener);
        };
    }, [currentSessionId, loadSession, isLoading, lastMessageSentTime]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (isLoadingModels) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                    <span className="text-slate-600">Loading AI assistant...</span>
                </div>
            </div>
        );
    }

    if (!isAvailable || availableModels.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-slate-900 mb-2">AI Assistant Unavailable</h3>
                    <p className="text-sm text-slate-600">
                        No AI models are configured. Please contact an administrator to set up OpenRouter.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-white" />
                        <h3 className="font-bold text-white text-lg">AI Assistant</h3>
                    </div>
                    <button
                        onClick={() => setShowModelSettings(true)}
                        className="px-3 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white text-sm font-medium hover:bg-white/30 transition-colors"
                        title="Select AI Model"
                    >
                        {selectedModel}
                    </button>
                </div>
            </div>

            {/* Model Settings Modal */}
            {showModelSettings && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={() => setShowModelSettings(false)}
                >
                    <div 
                        className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Select AI Model</h3>
                            <button
                                onClick={() => setShowModelSettings(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {availableModels.map((model) => (
                                <button
                                    key={model}
                                    onClick={() => {
                                        setSelectedModel(model);
                                        setShowModelSettings(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                                        selectedModel === model
                                            ? "bg-blue-50 border-blue-500 text-blue-900 font-semibold"
                                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                    }`}
                                >
                                    {model}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center py-12">
                        <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm mb-2">Start a conversation with your AI assistant</p>
                        <div className="text-xs text-slate-400 space-y-1">
                            <p>Ask questions about Arabic learning</p>
                            <p>Get help with vocabulary and grammar</p>
                            <p>Request practice suggestions</p>
                        </div>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <ChatMessage
                            key={index}
                            role={message.role}
                            content={message.content}
                            timestamp={message.timestamp}
                            navigationLinks={message.navigationLinks}
                        />
                    ))
                )}
                {isLoading && (
                    <div className="flex gap-3 justify-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                <span className="text-sm text-slate-600">Processing...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Error Display */}
            {error && (
                <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{error}</p>
                </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading || !selectedModel}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading || !selectedModel}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white p-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20 inline-flex items-center justify-center transform active:scale-95 disabled:cursor-not-allowed"
                        aria-label="Send message"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
