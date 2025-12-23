"use client";

import { useState, useEffect, useRef } from "react";
import { processAILearningRequest, getAvailableModelsForUsersAction, getDefaultModelAction, isAIAvailableForUser, type ProcessAILearningResult } from "@/app/actions";
import { Send, Loader2, Bot, User, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    result?: ProcessAILearningResult;
    navigationLinks?: Array<{ label: string; url: string }>;
}

export function AIChatWindow() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState<string>("");
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(true);
    const [isAvailable, setIsAvailable] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Check if AI is available and load models
    useEffect(() => {
        async function checkAvailabilityAndLoadModels() {
            try {
                setIsLoadingModels(true);
                
                // Check if AI is available for the current user
                const available = await isAIAvailableForUser();
                setIsAvailable(available);
                
                if (!available) {
                    setIsLoadingModels(false);
                    return;
                }
                
                const models = await getAvailableModelsForUsersAction();
                setAvailableModels(models);
                
                if (models.length > 0) {
                    // Try to get default model, otherwise use first available
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

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!input.trim() || !selectedModel || isLoading) return;

        const userPrompt = input.trim();
        const userMessage: ChatMessage = {
            role: "user",
            content: userPrompt,
            timestamp: new Date(),
        };

        // Build full conversation history with context (navigation links, results, etc.)
        const conversationHistory = messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            navigationLinks: msg.navigationLinks,
            result: msg.result ? {
                actions: msg.result.actions,
            } : undefined,
        }));

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setError(null);

        let result: ProcessAILearningResult | null = null;
        try {
            result = await processAILearningRequest(userPrompt, selectedModel, conversationHistory);
            
            const assistantMessage: ChatMessage = {
                role: "assistant",
                content: result.message || "Request processed",
                timestamp: new Date(),
                result,
                navigationLinks: result.navigationLinks,
            };

            setMessages(prev => [...prev, assistantMessage]);
            
            // Refresh the page if needed
            router.refresh();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to process request";
            setError(errorMessage);
            
            // Include user's request in error message for context
            const userRequest = userPrompt.length > 0 ? userPrompt : "your request";
            
            const assistantMessage: ChatMessage = {
                role: "assistant",
                content: result?.message || `Error processing "${userRequest}": ${errorMessage}`,
                timestamp: new Date(),
                result: result || {
                    success: false,
                    message: errorMessage,
                    error: errorMessage,
                },
            };

            setMessages(prev => [...prev, assistantMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderActionContent = (result: ProcessAILearningResult) => {
        if (!result.actions || result.actions.length === 0) {
            return null;
        }

        return (
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                {result.actions.map((action, idx) => {
                    if (action.type === "search" && action.data?.searchResults) {
                        return (
                            <div key={idx} className="text-xs">
                                <p className="font-semibold text-slate-700 mb-1">Search Results:</p>
                                <ul className="list-disc list-inside space-y-1 text-slate-600">
                                    {action.data.searchResults.slice(0, 5).map((item, i) => (
                                        <li key={i}>{item.title}</li>
                                    ))}
                                    {action.data.searchResults.length > 5 && (
                                        <li className="text-slate-400">...and {action.data.searchResults.length - 5} more</li>
                                    )}
                                </ul>
                            </div>
                        );
                    }
                    if (action.type === "test" && action.data?.testQuestions) {
                        return (
                            <div key={idx} className="text-xs">
                                <p className="font-semibold text-slate-700 mb-1">Test Questions ({action.data.testQuestions.length}):</p>
                                <ul className="list-disc list-inside space-y-1 text-slate-600">
                                    {action.data.testQuestions.slice(0, 3).map((q, i) => (
                                        <li key={i}>{q.question}</li>
                                    ))}
                                    {action.data.testQuestions.length > 3 && (
                                        <li className="text-slate-400">...and {action.data.testQuestions.length - 3} more</li>
                                    )}
                                </ul>
                            </div>
                        );
                    }
                    if (action.type === "practice" && action.data?.practiceSuggestions) {
                        return (
                            <div key={idx} className="text-xs">
                                <p className="font-semibold text-slate-700 mb-1">Practice Suggestions:</p>
                                <ul className="list-disc list-inside space-y-1 text-slate-600">
                                    {action.data.practiceSuggestions.map((suggestion, i) => (
                                        <li key={i} className="break-words">{suggestion.description}</li>
                                    ))}
                                </ul>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        );
    };

    if (isLoadingModels) {
        return (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                    <span className="ml-3 text-slate-600">Loading AI assistant...</span>
                </div>
            </div>
        );
    }

    if (availableModels.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-center gap-3 text-amber-600 mb-2">
                    <AlertCircle size={20} />
                    <h3 className="font-semibold text-slate-900">AI Assistant Unavailable</h3>
                </div>
                <p className="text-sm text-slate-600">
                    No AI models are configured. Please contact an administrator to set up OpenRouter.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-[500px] lg:h-[600px]">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-white" />
                        <h3 className="font-bold text-white text-lg">AI Assistant</h3>
                    </div>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50"
                    >
                        {availableModels.map((model) => (
                            <option key={model} value={model} className="text-slate-900">
                                {model}
                            </option>
                        ))}
                    </select>
                </div>
                <p className="text-white/90 text-xs">Ask questions, search content, or get learning help</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 ? (
                    <div className="text-center py-12">
                        <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm mb-2">Start a conversation with your learning assistant</p>
                        <div className="text-xs text-slate-400 space-y-1">
                            <p>Explain: "What does 'كتاب' mean?"</p>
                            <p>Search: "Find vocabulary about food"</p>
                            <p>Navigate: "Take me to Unit 3"</p>
                            <p>Practice: "What should I study next?"</p>
                            <p>Test: "Generate a quiz for Lesson 5"</p>
                        </div>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {message.role === "assistant" && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                            )}
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                    message.role === "user"
                                        ? "bg-blue-600 text-white"
                                        : "bg-white border border-slate-200 text-slate-900"
                                }`}
                            >
                                <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</div>
                                
                                {/* Show action content */}
                                {message.result && renderActionContent(message.result)}
                                
                                {/* Show navigation links */}
                                {message.navigationLinks && message.navigationLinks.length > 0 && (
                                    <div className={`mt-3 pt-3 ${message.result?.actions && message.result.actions.length > 0 ? '' : 'border-t border-slate-200'}`}>
                                        <p className="text-xs font-semibold text-slate-700 mb-2">Quick Links:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {message.navigationLinks.map((link, idx) => (
                                                <a
                                                    key={idx}
                                                    href={link.url}
                                                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow"
                                                >
                                                    {link.label}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Show error if any */}
                                {message.result?.error && (
                                    <div className="mt-3 pt-3 border-t border-slate-200">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-red-700">{message.result.error}</p>
                                        </div>
                                    </div>
                                )}
                                
                                <p className="text-xs opacity-60 mt-2">
                                    {message.timestamp.toLocaleTimeString()}
                                </p>
                            </div>
                            {message.role === "user" && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center">
                                    <User className="w-5 h-5 text-slate-700" />
                                </div>
                            )}
                        </div>
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
                        placeholder="Try: 'What does كتاب mean?' or 'Search for food vocabulary'..."
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

