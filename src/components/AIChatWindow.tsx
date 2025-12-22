"use client";

import { useState, useEffect, useRef } from "react";
import { processAITodoRequest, getAvailableModelsForUsersAction, getDefaultModelAction, isAIAvailableForUser, type ProcessAITodoResult } from "@/app/actions";
import { Send, Loader2, Bot, User, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    result?: ProcessAITodoResult;
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

        // Build conversation history from previous messages before adding the new one
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
            
            // Refresh the page to show updated todos
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
                <p className="text-white/90 text-xs">Describe what you want to do with your tasks</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 ? (
                    <div className="text-center py-12">
                        <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm mb-2">Start a conversation with AI</p>
                        <div className="text-xs text-slate-400 space-y-1">
                            <p>Simple: "Add buy groceries" or "Complete the first task"</p>
                            <p>Groups: "Create a Work group and add 3 tasks"</p>
                            <p>Complex: "Create groups for Urgent, Important, Later and organize my tasks"</p>
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
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                
                                {/* Only show result section if there are executed actions or an actual error */}
                                {message.result && (
                                    (message.result.executedActions.length > 0 || message.result.error) && (
                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                            {message.result.success && message.result.executedActions.length > 0 ? (
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        {formatActionSummary(message.result) && (
                                                            <p className="text-xs font-semibold text-emerald-700 mb-1">
                                                                {formatActionSummary(message.result)}
                                                            </p>
                                                        )}
                                                        {message.result.executedActions.some(a => !a.success) && (
                                                            <div className="text-xs text-amber-700">
                                                                {message.result.executedActions
                                                                    .filter(a => !a.success)
                                                                    .map((a, i) => (
                                                                        <p key={i}>
                                                                            {a.type} action failed: {a.error}
                                                                        </p>
                                                                    ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : message.result.error ? (
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                                    <p className="text-xs text-red-700">{message.result.error}</p>
                                                </div>
                                            ) : null}
                                        </div>
                                    )
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
                        placeholder="Try: 'Add buy groceries' or 'Create a Work group and add 3 tasks'..."
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

