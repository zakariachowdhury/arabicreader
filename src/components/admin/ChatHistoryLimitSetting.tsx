"use client";

import { useState, useTransition } from "react";
import { getChatHistoryLimit, setChatHistoryLimit } from "@/app/admin/actions";
import { MessageSquare, Loader2 } from "lucide-react";
import { useEffect } from "react";

export function ChatHistoryLimitSetting({ initialLimit }: { initialLimit: number }) {
    const [limit, setLimit] = useState(initialLimit);
    const [inputValue, setInputValue] = useState(initialLimit.toString());
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);

    // Sync input value when initialLimit changes
    useEffect(() => {
        setLimit(initialLimit);
        setInputValue(initialLimit.toString());
    }, [initialLimit]);

    const handleUpdate = async () => {
        const newLimit = parseInt(inputValue, 10);
        
        if (isNaN(newLimit) || newLimit < 1 || newLimit > 100) {
            alert("Please enter a number between 1 and 100");
            setInputValue(limit.toString());
            return;
        }

        setIsLoading(true);
        setLimit(newLimit);

        startTransition(async () => {
            try {
                await setChatHistoryLimit(newLimit);
            } catch (error) {
                console.error("Failed to update chat history limit:", error);
                // Revert on error
                setLimit(limit);
                setInputValue(limit.toString());
                alert("Failed to update chat history limit. Please try again.");
            } finally {
                setIsLoading(false);
            }
        });
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleUpdate();
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-slate-100 rounded-xl">
                        <MessageSquare className="w-6 h-6 text-slate-700" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Chat History Limit</h3>
                        <p className="text-sm text-slate-500 mb-3">
                            Number of previous messages to send to AI. Lower values reduce token usage and costs.
                        </p>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isPending || isLoading}
                                className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-slate-900 disabled:bg-slate-50 disabled:cursor-not-allowed"
                            />
                            <span className="text-sm text-slate-600">messages</span>
                            <button
                                onClick={handleUpdate}
                                disabled={isPending || isLoading || parseInt(inputValue, 10) === limit}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                            >
                                {isPending || isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    "Save"
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Current: {limit} messages (approximately {Math.floor(limit / 2)} user messages + {Math.floor(limit / 2)} AI responses)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

