"use client";

import { useState, useTransition } from "react";
import { resetLessonProgress } from "@/app/actions";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ResetProgressButtonProps {
    lessonId: number;
    lessonTitle: string;
    onConfirmChange?: (show: boolean) => void;
}

export function ResetProgressButton({ lessonId, lessonTitle, onConfirmChange }: ResetProgressButtonProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleShowConfirm = () => {
        setShowConfirm(true);
        onConfirmChange?.(true);
    };

    const handleCancel = () => {
        setShowConfirm(false);
        onConfirmChange?.(false);
    };

    const handleReset = () => {
        startTransition(async () => {
            try {
                await resetLessonProgress(lessonId);
                setShowConfirm(false);
                onConfirmChange?.(false);
                router.refresh();
            } catch (error) {
                console.error("Failed to reset progress:", error);
                alert("Failed to reset progress. Please try again.");
            }
        });
    };

    return (
        <>
            <button
                onClick={handleShowConfirm}
                disabled={showConfirm}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reset progress for this lesson"
            >
                <RotateCcw className="w-4 h-4" />
                Reset Progress
            </button>
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-900 text-lg mb-2">Reset Progress?</h3>
                                <p className="text-sm text-slate-600">
                                    This will permanently delete all your progress for "{lessonTitle}". 
                                    This action cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleCancel}
                                disabled={isPending}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={isPending}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                {isPending ? "Resetting..." : "Yes, Reset Progress"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

