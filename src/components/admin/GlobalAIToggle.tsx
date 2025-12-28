"use client";

import { useState, useTransition } from "react";
import { getGlobalAIEnabled, setGlobalAIEnabled } from "@/app/admin/actions";
import { Sparkles, XCircle } from "lucide-react";
import { toast } from "@/lib/toast";

export function GlobalAIToggle({ initialEnabled }: { initialEnabled: boolean }) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [isPending, startTransition] = useTransition();

    const handleToggle = async () => {
        const newValue = !enabled;
        setEnabled(newValue);

        startTransition(async () => {
            try {
                await setGlobalAIEnabled(newValue);
            } catch (error) {
                console.error("Failed to update global AI setting:", error);
                // Revert on error
                setEnabled(!newValue);
                toast.error("Failed to update global AI setting. Please try again.");
            }
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${enabled ? "bg-slate-200" : "bg-slate-100"}`}>
                        {enabled ? (
                            <Sparkles className={`w-6 h-6 ${enabled ? "text-slate-700" : "text-slate-400"}`} />
                        ) : (
                            <XCircle className="w-6 h-6 text-slate-400" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Global AI Feature</h3>
                        <p className="text-sm text-slate-500">
                            {enabled 
                                ? "AI features are enabled for all users (subject to individual user settings)" 
                                : "AI features are disabled for all users"}
                        </p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={enabled}
                        onChange={handleToggle}
                        disabled={isPending}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700 disabled:opacity-50"></div>
                </label>
            </div>
        </div>
    );
}

