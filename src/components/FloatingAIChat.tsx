"use client";

import { useState, useEffect, useRef } from "react";
import { processAITodoRequest, getAvailableModelsForUsersAction, getDefaultModelAction, isAIAvailableForUser, type ProcessAITodoResult } from "@/app/actions";
import { Send, Loader2, Bot, User, AlertCircle, CheckCircle2, Sparkles, X, Minimize2, Maximize2, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    result?: ProcessAITodoResult;
}

export function FloatingAIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showModelSettings, setShowModelSettings] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>("");
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(true);
    const [isAvailable, setIsAvailable] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { data: session } = useSession();

    // Check if AI is available for user and load models
    useEffect(() => {
        async function checkAvailabilityAndLoadModels() {
            try {
                setIsLoadingModels(true);
                
                // Check if AI is available for the current user (checks global, user, and OpenRouter settings)
                const available = await isAIAvailableForUser();
                setIsAvailable(available);
                
                if (!available) {
                    setIsLoadingModels(false);
                    return;
                }
                
                // Load available models
                const models = await getAvailableModelsForUsersAction();
                setAvailableModels(models);
                
                if (models.length > 0) {
                    const defaultModel = await getDefaultModelAction();
                    if (defaultModel && models.includes(defaultModel)) {
                        setSelectedModel(defaultModel);
                    } else {
                        setSelectedModel(models[0]);
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

    // Scroll to bottom when messages change
    useEffect(() => {
        if (isOpen && !isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen, isMinimized]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!input.trim() || !selectedModel || isLoading) return;

        const userPrompt = input.trim();
        const userMessage: ChatMessage = {
            role: "user",
            content: userPrompt,
            timestamp: new Date(),
        };

        const conversationHistory = messages.map(msg => ({
            role: msg.role,
            content: msg.content,
        }));

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setError(null);

        let result: ProcessAITodoResult | null = null;
        try {
            result = await processAITodoRequest(userPrompt, selectedModel, conversationHistory);
            
            const assistantMessage: ChatMessage = {
                role: "assistant",
                content: result.message || "Task completed",
                timestamp: new Date(),
                result,
            };

            setMessages(prev => [...prev, assistantMessage]);
            
            router.refresh();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to process request";
            setError(errorMessage);
            
            const userRequest = userPrompt.length > 0 ? userPrompt : "your request";
            
            const assistantMessage: ChatMessage = {
                role: "assistant",
                content: result?.message || `Error processing "${userRequest}": ${errorMessage}`,
                timestamp: new Date(),
                result: result || {
                    success: false,
                    message: errorMessage,
                    executedActions: [],
                    error: errorMessage,
                },
            };

            setMessages(prev => [...prev, assistantMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatActionSummary = (result: ProcessAITodoResult) => {
        if (result.executedActions.length === 0) {
            return null;
        }

        const actionCounts: Record<string, number> = {};
        result.executedActions.forEach(action => {
            if (action.success) {
                actionCounts[action.type] = (actionCounts[action.type] || 0) + 1;
            }
        });

        const summaries: string[] = [];
        if (actionCounts.add) summaries.push(`${actionCounts.add} added`);
        if (actionCounts.edit) summaries.push(`${actionCounts.edit} edited`);
        if (actionCounts.complete) summaries.push(`${actionCounts.complete} completed`);
        if (actionCounts.uncomplete) summaries.push(`${actionCounts.uncomplete} uncompleted`);
        if (actionCounts.delete) summaries.push(`${actionCounts.delete} deleted`);

        return summaries.length > 0 ? summaries.join(", ") : null;
    };

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
                                        <h4 className="font-bold text-sm mb-1">AI Assistant Available!</h4>
                                        <p className="text-xs text-white/90 mb-3">
                                            Click here to manage your tasks with AI. Ask me to add, complete, edit, or delete tasks!
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
                                <button
                                    onClick={() => setShowModelSettings(true)}
                                    className="p-1.5 text-white hover:bg-white/20 rounded transition-colors"
                                    aria-label="Model Settings"
                                    title="Select AI Model"
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
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
                                        <p className="text-slate-500 text-xs mb-2">Start a conversation with AI</p>
                                        <div className="text-xs text-slate-400 space-y-1">
                                            <p>Simple: "Add buy groceries"</p>
                                            <p>Groups: "Create Work group and add 3 tasks"</p>
                                            <p>Complex: "Create groups and organize my tasks"</p>
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
                                                <p className="text-xs whitespace-pre-wrap break-words">{message.content}</p>
                                                
                                                {message.result && (
                                                    (message.result.executedActions.length > 0 || message.result.error) && (
                                                        <div className="mt-2 pt-2 border-t border-slate-200">
                                                            {message.result.success && message.result.executedActions.length > 0 ? (
                                                                <div className="flex items-start gap-1.5">
                                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                                                                    <div className="flex-1">
                                                                        {formatActionSummary(message.result) && (
                                                                            <p className="text-[10px] font-semibold text-emerald-700 mb-0.5">
                                                                                {formatActionSummary(message.result)}
                                                                            </p>
                                                                        )}
                                                                        {message.result.executedActions.some(a => !a.success) && (
                                                                            <div className="text-[10px] text-amber-700">
                                                                                {message.result.executedActions
                                                                                    .filter(a => !a.success)
                                                                                    .map((a, i) => (
                                                                                        <p key={i}>
                                                                                            {a.type} failed: {a.error}
                                                                                        </p>
                                                                                    ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : message.result.error ? (
                                                                <div className="flex items-start gap-1.5">
                                                                    <AlertCircle className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
                                                                    <p className="text-[10px] text-red-700">{message.result.error}</p>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    )
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
                                        placeholder="Try: 'Add task' or 'Create group and add tasks'..."
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

