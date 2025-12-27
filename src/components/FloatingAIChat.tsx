"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Bot, User, AlertCircle, CheckCircle2, Sparkles, X, Minimize2, Maximize2, Settings, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSession } from "@/lib/auth-client";
import { useChat, type ChatMessage } from "@/hooks/useChat";

export function FloatingAIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showModelSettings, setShowModelSettings] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();
    const isInitialMount = useRef(true);

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
        isLoadingSession,
        lastMessageSentTime,
        setInput,
        handleSubmit,
        handleNewChat,
        loadSession,
        setSelectedModel,
        setError,
    } = useChat({
        autoLoadLastSession: true,
    });

    // Restore persisted chat state from localStorage on mount (only UI state, not messages)
    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const persistedIsOpen = localStorage.getItem("ai-chat-is-open");
            const persistedIsMinimized = localStorage.getItem("ai-chat-is-minimized");

            if (persistedIsOpen === "true") {
                setIsOpen(true);
            }
            if (persistedIsMinimized === "true") {
                setIsMinimized(true);
            }
        } catch (err) {
            console.error("Failed to restore chat state:", err);
        }
    }, []);

    // Persist isOpen state to localStorage
    useEffect(() => {
        if (typeof window === "undefined" || isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (isOpen) {
            localStorage.setItem("ai-chat-is-open", "true");
        } else {
            localStorage.removeItem("ai-chat-is-open");
        }
    }, [isOpen]);

    // Persist isMinimized state to localStorage
    useEffect(() => {
        if (typeof window === "undefined" || isInitialMount.current) return;
        if (isMinimized) {
            localStorage.setItem("ai-chat-is-minimized", "true");
        } else {
            localStorage.removeItem("ai-chat-is-minimized");
        }
    }, [isMinimized]);

    // Show tooltip once after login if user hasn't seen it
    useEffect(() => {
        if (session?.user && isAvailable && !isLoadingModels && !isOpen) {
            const hasSeenTooltip = localStorage.getItem("ai-assistant-tooltip-seen");
            if (!hasSeenTooltip) {
                // Delay to ensure the button is rendered
                const timer = setTimeout(() => {
                    setShowTooltip(true);
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [session, isAvailable, isLoadingModels, isOpen]);

    // Hide tooltip when user interacts with the button
    useEffect(() => {
        if (isOpen) {
            setShowTooltip(false);
            localStorage.setItem("ai-assistant-tooltip-seen", "true");
        }
    }, [isOpen]);

    // Reload current session when chat opens to get latest messages (only once when opening)
    // But don't reload if we just started a new chat (currentSessionId is null)
    useEffect(() => {
        if (isOpen && !isLoadingModels && isAvailable && currentSessionId && !isLoadingSession) {
            // Reload the current session to get any new messages when first opening
            loadSession(currentSessionId);
        }
        // Only run when isOpen changes from false to true, not on every render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Reload session when chat-updated event is received (from chat page)
    // Only reload if we're not currently processing a message (to avoid reloading our own messages)
    useEffect(() => {
        if (!isOpen || !currentSessionId || isLoadingSession) return;

        let reloadTimeout: NodeJS.Timeout | null = null;
        let lastReloadTime = 0;
        const DEBOUNCE_MS = 1000; // Don't reload more than once per second

        const handleChatUpdate = (e: CustomEvent) => {
            const eventSessionId = e.detail?.sessionId;
            const now = Date.now();
            
            // Skip reload if we just sent a message ourselves (within last 2 seconds)
            // This prevents reloading when we're the ones who triggered the event
            if (now - lastMessageSentTime.current < 2000) {
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
                reloadTimeout = setTimeout(() => {
                    loadSession(currentSessionId);
                }, 200);
            }
        };

        window.addEventListener("chat-updated" as any, handleChatUpdate as EventListener);

        return () => {
            if (reloadTimeout) {
                clearTimeout(reloadTimeout);
            }
            window.removeEventListener("chat-updated" as any, handleChatUpdate as EventListener);
        };
    }, [isOpen, currentSessionId, isLoadingSession, loadSession, isLoading, lastMessageSentTime]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (isOpen && !isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen, isMinimized]);

    // Don't show anything if user is not logged in, still loading, not available, or no models
    if (!session?.user || isLoadingModels || !isAvailable || availableModels.length === 0) {
        return null;
    }

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <div className="fixed bottom-6 right-6 z-50" ref={tooltipRef}>
                    <button
                        onClick={() => {
                            setIsOpen(true);
                            setShowTooltip(false);
                            localStorage.setItem("ai-assistant-tooltip-seen", "true");
                        }}
                        className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-2xl shadow-blue-500/50 flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 relative"
                        aria-label="Open AI Assistant"
                    >
                        <Sparkles className="w-6 h-6" />
                        {showTooltip && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                        )}
                    </button>

                    {/* Tooltip */}
                    {showTooltip && (
                        <div className="absolute bottom-full right-0 mb-3 w-64 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl shadow-2xl p-4 relative">
                                <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-3 h-3 bg-gradient-to-br from-blue-600 to-purple-600"></div>
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm mb-1">Learning Assistant Available!</h4>
                                        <p className="text-xs text-white/90 mb-3">
                                            Click here to get help with learning Arabic. Ask questions, search content, practice, or take tests!
                                        </p>
                                        <button
                                            onClick={() => {
                                                setShowTooltip(false);
                                                localStorage.setItem("ai-assistant-tooltip-seen", "true");
                                            }}
                                            className="text-xs font-semibold text-white/90 hover:text-white underline"
                                        >
                                            Got it
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowTooltip(false);
                                            localStorage.setItem("ai-assistant-tooltip-seen", "true");
                                        }}
                                        className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
                                        aria-label="Dismiss tooltip"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Floating Chat Window */}
            {isOpen && (
                <div
                    className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 ${
                        isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
                    }`}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Sparkles className="w-5 h-5 text-white flex-shrink-0" />
                            <h3 className="font-bold text-white text-sm truncate">AI Assistant</h3>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                            {!isMinimized && (
                                <>
                                    <button
                                        onClick={handleNewChat}
                                        className="p-1.5 text-white hover:bg-white/20 rounded transition-colors"
                                        aria-label="New Chat"
                                        title="Start New Chat"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setShowModelSettings(true)}
                                        className="p-1.5 text-white hover:bg-white/20 rounded transition-colors"
                                        aria-label="Model Settings"
                                        title="Select AI Model"
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-1.5 text-white hover:bg-white/20 rounded transition-colors"
                                aria-label={isMinimized ? "Maximize" : "Minimize"}
                            >
                                {isMinimized ? (
                                    <Maximize2 className="w-4 h-4" />
                                ) : (
                                    <Minimize2 className="w-4 h-4" />
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setIsMinimized(false);
                                    // Clear persisted state when user explicitly closes
                                    localStorage.removeItem("ai-chat-is-open");
                                    localStorage.removeItem("ai-chat-is-minimized");
                                }}
                                className="p-1.5 text-white hover:bg-white/20 rounded transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Model Settings Modal */}
                    {showModelSettings && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setShowModelSettings(false)}>
                            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-900">Select AI Model</h3>
                                    <button
                                        onClick={() => setShowModelSettings(false)}
                                        className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                                        aria-label="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {[...availableModels].sort().map((model) => (
                                        <button
                                            key={model}
                                            onClick={() => {
                                                setSelectedModel(model);
                                                setShowModelSettings(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                                                selectedModel === model
                                                    ? "bg-blue-50 border-blue-500 text-blue-900 font-semibold"
                                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">{model}</span>
                                                {selectedModel === model && (
                                                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {!isMinimized && (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                                {messages.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Bot className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500 text-xs mb-2">Start learning with AI</p>
                                        <div className="text-xs text-slate-400 space-y-1">
                                            <p>"What does 'كتاب' mean?"</p>
                                            <p>"Search for food vocabulary"</p>
                                            <p>"What should I study next?"</p>
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((message, index) => (
                                        <div
                                            key={index}
                                            className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            {message.role === "assistant" && (
                                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                                    <Bot className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                                                    message.role === "user"
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-white border border-slate-200 text-slate-900"
                                                }`}
                                            >
                                                <div className="text-xs break-words leading-relaxed">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            // Style code blocks
                                                            code: ({ node, className, children, ...props }) => {
                                                                const isInline = !className;
                                                                const isUser = message.role === "user";
                                                                return isInline ? (
                                                                    <code
                                                                        className={`px-1 py-0.5 rounded text-[10px] font-mono ${
                                                                            isUser
                                                                                ? "bg-blue-700 text-blue-100"
                                                                                : "bg-slate-100 text-slate-800"
                                                                        }`}
                                                                        {...props}
                                                                    >
                                                                        {children}
                                                                    </code>
                                                                ) : (
                                                                    <code
                                                                        className={`block p-2 rounded text-[10px] font-mono overflow-x-auto ${
                                                                            isUser
                                                                                ? "bg-blue-700/50 text-blue-100"
                                                                                : "bg-slate-100 text-slate-800"
                                                                        }`}
                                                                        {...props}
                                                                    >
                                                                        {children}
                                                                    </code>
                                                                );
                                                            },
                                                            // Style pre blocks
                                                            pre: ({ children }) => {
                                                                return <pre className="my-1">{children}</pre>;
                                                            },
                                                            // Style links
                                                            a: ({ href, children }) => {
                                                                const isUser = message.role === "user";
                                                                return (
                                                                    <a
                                                                        href={href}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={`underline hover:no-underline ${
                                                                            isUser
                                                                                ? "text-blue-100 hover:text-white"
                                                                                : "text-blue-600 hover:text-blue-700"
                                                                        }`}
                                                                    >
                                                                        {children}
                                                                    </a>
                                                                );
                                                            },
                                                            // Style lists
                                                            ul: ({ children }) => {
                                                                const isUser = message.role === "user";
                                                                return (
                                                                    <ul className={`my-1 space-y-0.5 ${isUser ? "text-white" : "text-slate-900"}`}>
                                                                        {children}
                                                                    </ul>
                                                                );
                                                            },
                                                            ol: ({ children }) => {
                                                                const isUser = message.role === "user";
                                                                return (
                                                                    <ol className={`my-1 space-y-0.5 ${isUser ? "text-white" : "text-slate-900"}`}>
                                                                        {children}
                                                                    </ol>
                                                                );
                                                            },
                                                            li: ({ children }) => {
                                                                const isUser = message.role === "user";
                                                                return (
                                                                    <li className={`ml-3 ${isUser ? "text-white" : "text-slate-900"}`}>
                                                                        {children}
                                                                    </li>
                                                                );
                                                            },
                                                            // Style headings
                                                            h1: ({ children }) => {
                                                                const isUser = message.role === "user";
                                                                return (
                                                                    <h1 className={`text-sm font-bold mt-2 mb-1 first:mt-0 ${isUser ? "text-white" : "text-slate-900"}`}>
                                                                        {children}
                                                                    </h1>
                                                                );
                                                            },
                                                            h2: ({ children }) => {
                                                                const isUser = message.role === "user";
                                                                return (
                                                                    <h2 className={`text-xs font-bold mt-2 mb-1 first:mt-0 ${isUser ? "text-white" : "text-slate-900"}`}>
                                                                        {children}
                                                                    </h2>
                                                                );
                                                            },
                                                            h3: ({ children }) => {
                                                                const isUser = message.role === "user";
                                                                return (
                                                                    <h3 className={`text-xs font-bold mt-1 mb-0.5 first:mt-0 ${isUser ? "text-white" : "text-slate-900"}`}>
                                                                        {children}
                                                                    </h3>
                                                                );
                                                            },
                                                            // Style paragraphs
                                                            p: ({ children }) => {
                                                                const isUser = message.role === "user";
                                                                return (
                                                                    <p className={`my-1 first:mt-0 last:mb-0 ${isUser ? "text-white" : "text-slate-900"}`}>
                                                                        {children}
                                                                    </p>
                                                                );
                                                            },
                                                            // Style blockquotes
                                                            blockquote: ({ children }) => {
                                                                const isUser = message.role === "user";
                                                                return (
                                                                    <blockquote
                                                                        className={`my-1 pl-2 border-l-2 ${
                                                                            isUser
                                                                                ? "border-blue-400 text-blue-100"
                                                                                : "border-slate-300 text-slate-700"
                                                                        }`}
                                                                    >
                                                                        {children}
                                                                    </blockquote>
                                                                );
                                                            },
                                                            // Style strong/bold
                                                            strong: ({ children }) => {
                                                                const isUser = message.role === "user";
                                                                return (
                                                                    <strong className={`font-semibold ${isUser ? "text-white" : "text-slate-900"}`}>
                                                                        {children}
                                                                    </strong>
                                                                );
                                                            },
                                                            // Style emphasis/italic
                                                            em: ({ children }) => {
                                                                const isUser = message.role === "user";
                                                                return (
                                                                    <em className={isUser ? "text-white" : "text-slate-900"}>
                                                                        {children}
                                                                    </em>
                                                                );
                                                            },
                                                        }}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                                
                                                {/* Show navigation links */}
                                                {message.navigationLinks && message.navigationLinks.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-slate-200">
                                                        <p className="text-[10px] font-semibold text-slate-700 mb-1">Quick Links:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {message.navigationLinks.map((link, idx) => (
                                                                <a
                                                                    key={idx}
                                                                    href={link.url}
                                                                    className="text-[10px] px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow whitespace-normal break-words"
                                                                >
                                                                    {link.label}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <p className="text-[10px] opacity-60 mt-1">
                                                    {message.timestamp.toLocaleTimeString()}
                                                </p>
                                            </div>
                                            {message.role === "user" && (
                                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-slate-700" />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                                {isLoading && (
                                    <div className="flex gap-2 justify-start">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                                <span className="text-xs text-slate-600">Processing...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Error Display */}
                            {error && (
                                <div className="mx-4 mb-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-red-700">{error}</p>
                                </div>
                            )}

                            {/* Input */}
                            <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 bg-white">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Try: 'What does كتاب mean?' or 'Search vocabulary'..."
                                        disabled={isLoading || !selectedModel}
                                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!input.trim() || isLoading || !selectedModel}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white p-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20 inline-flex items-center justify-center transform active:scale-95 disabled:cursor-not-allowed"
                                        aria-label="Send message"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
