"use client";

import { useState } from "react";
import { CheckSquare, FolderKanban } from "lucide-react";

type Tab = "tasks" | "groups";

type DashboardTabsProps = {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
};

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
    return (
        <div className="flex gap-2 border-b border-slate-200 mb-6">
            <button
                onClick={() => onTabChange("tasks")}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
                    activeTab === "tasks"
                        ? "text-blue-600 border-blue-600"
                        : "text-slate-500 border-transparent hover:text-slate-700"
                }`}
            >
                <CheckSquare className="w-4 h-4" />
                Tasks
            </button>
            <button
                onClick={() => onTabChange("groups")}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
                    activeTab === "groups"
                        ? "text-blue-600 border-blue-600"
                        : "text-slate-500 border-transparent hover:text-slate-700"
                }`}
            >
                <FolderKanban className="w-4 h-4" />
                Groups
            </button>
        </div>
    );
}

