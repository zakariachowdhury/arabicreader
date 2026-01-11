"use client";

import { CheckCircle2 } from "lucide-react";
import { ProgressData } from "@/app/actions";

interface ProgressBarProps {
    progress: ProgressData;
    showLabel?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function ProgressBar({ progress, showLabel = true, size = "md", className = "" }: ProgressBarProps) {
    const heightClass = {
        sm: "h-1.5",
        md: "h-2",
        lg: "h-3",
    }[size];

    return (
        <div className={`w-full ${className}`}>
            {showLabel && (
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">
                        {progress.wordsMastered}/{progress.totalWords} words mastered
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                        {progress.completionPercentage}%
                    </span>
                </div>
            )}
            <div className={`w-full bg-slate-200 rounded-full overflow-hidden ${heightClass}`}>
                <div
                    className={`h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 rounded-full ${
                        progress.completionPercentage === 100 ? "from-emerald-500 to-emerald-600" : ""
                    }`}
                    style={{ width: `${progress.completionPercentage}%` }}
                />
            </div>
        </div>
    );
}

interface ProgressBadgeProps {
    progress: ProgressData;
    className?: string;
}

export function ProgressBadge({ progress, className = "" }: ProgressBadgeProps) {
    const isComplete = progress.completionPercentage === 100 && progress.totalWords > 0;

    return (
        <div className={`inline-flex items-center gap-1.5 ${className}`}>
            {isComplete ? (
                <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-600">Complete</span>
                </>
            ) : (
                <span className="text-xs font-medium text-slate-600">
                    {progress.completionPercentage}%
                </span>
            )}
        </div>
    );
}

interface ProgressStatsProps {
    progress: ProgressData;
    variant?: "compact" | "detailed";
    className?: string;
}

export function ProgressStats({ progress, variant = "compact", className = "" }: ProgressStatsProps) {
    if (variant === "compact") {
        return (
            <div className={`text-sm text-slate-600 ${className}`}>
                <span className="font-semibold text-slate-900">{progress.wordsMastered}</span>
                <span className="text-slate-500">/{progress.totalWords} words</span>
            </div>
        );
    }

    return (
        <div className={`space-y-1 ${className}`}>
            <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Words mastered:</span>
                <span className="font-semibold text-slate-900">
                    {progress.wordsMastered}/{progress.totalWords}
                </span>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Words seen:</span>
                <span className="font-semibold text-slate-900">{progress.wordsSeen}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Completion:</span>
                <span className="font-semibold text-slate-900">{progress.completionPercentage}%</span>
            </div>
            {progress.lastActivityDate && (
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200">
                    <span>Last activity:</span>
                    <span>{new Date(progress.lastActivityDate).toLocaleDateString()}</span>
                </div>
            )}
        </div>
    );
}



