"use client";

import { type Group } from "@/db/schema";

const DEFAULT_COLOR = "#3B82F6";

type GroupSelectorProps = {
    groups: Group[];
    selectedGroupId: number | null | undefined;
    onGroupChange: (groupId: number | null) => void;
    className?: string;
};

export function GroupSelector({ groups, selectedGroupId, onGroupChange, className = "" }: GroupSelectorProps) {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        onGroupChange(value === "" ? null : parseInt(value, 10));
    };

    return (
        <select
            value={selectedGroupId === null || selectedGroupId === undefined ? "" : selectedGroupId}
            onChange={handleChange}
            className={`px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 ${className}`}
        >
            <option value="">No Group</option>
            {groups.map((group) => (
                <option key={group.id} value={group.id}>
                    {group.name}
                </option>
            ))}
        </select>
    );
}

type GroupBadgeProps = {
    group: { id: number; name: string; color: string | null } | null;
    className?: string;
};

export function GroupBadge({ group, className = "" }: GroupBadgeProps) {
    if (!group) return null;

    const color = group.color || DEFAULT_COLOR;

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${className}`}
            style={{
                backgroundColor: `${color}20`,
                color: color,
                border: `1px solid ${color}40`,
            }}
        >
            <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
            />
            {group.name}
        </span>
    );
}

