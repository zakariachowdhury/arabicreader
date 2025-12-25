"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Calendar } from "lucide-react";

export function DateRangeFilter({
    defaultStartDate,
    defaultEndDate,
}: {
    defaultStartDate: string;
    defaultEndDate: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);

    const handleQuickSelect = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);

        const startStr = start.toISOString().split("T")[0];
        const endStr = end.toISOString().split("T")[0];

        setStartDate(startStr);
        setEndDate(endStr);
        updateURL(startStr, endStr);
    };

    const updateURL = (start: string, end: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("startDate", start);
        params.set("endDate", end);
        router.push(`/admin/analytics?${params.toString()}`);
    };

    const handleApply = () => {
        updateURL(startDate, endDate);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <div className="flex items-center gap-4 mb-4">
                <Calendar className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900">
                    Date Range Filter
                </h3>
            </div>
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700">From:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700">To:</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    onClick={handleApply}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    Apply
                </button>
                <div className="flex gap-2 ml-auto">
                    <button
                        onClick={() => handleQuickSelect(7)}
                        className="px-3 py-1 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                    >
                        Last 7 days
                    </button>
                    <button
                        onClick={() => handleQuickSelect(30)}
                        className="px-3 py-1 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                    >
                        Last 30 days
                    </button>
                    <button
                        onClick={() => handleQuickSelect(90)}
                        className="px-3 py-1 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                    >
                        Last 90 days
                    </button>
                </div>
            </div>
        </div>
    );
}


