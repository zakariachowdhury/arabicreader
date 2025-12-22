"use client";

import { useRef, useState, useEffect } from "react";
import { addTodo } from "@/app/actions";
import { GroupSelector } from "@/components/GroupSelector";
import { type Group } from "@/db/schema";
import { Plus } from "lucide-react";

export function AddTodoForm({ groups, defaultGroupId }: { groups: Group[]; defaultGroupId?: number | null }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(defaultGroupId || null);

    // Update selectedGroupId when defaultGroupId changes (e.g., after creating first group)
    useEffect(() => {
        if (defaultGroupId !== undefined && defaultGroupId !== null && selectedGroupId === null) {
            setSelectedGroupId(defaultGroupId);
        }
    }, [defaultGroupId]);

    async function clientAction(formData: FormData) {
        // Always append groupId to distinguish between "no group selected" and "use default"
        // If null, send empty string to explicitly indicate "uncategorized"
        formData.append("groupId", selectedGroupId !== null ? selectedGroupId.toString() : "");
        await addTodo(formData);
        formRef.current?.reset();
        // Keep the last selected group instead of resetting to default
        // If no group was selected, it stays null (uncategorized)
    }

    return (
        <form ref={formRef} action={clientAction} className="flex gap-2">
            <input
                type="text"
                name="content"
                placeholder="What needs to be done?"
                required
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 text-slate-900 placeholder:text-slate-400"
            />
            {groups.length > 0 && (
                <GroupSelector
                    groups={groups}
                    selectedGroupId={selectedGroupId}
                    onGroupChange={setSelectedGroupId}
                    className="w-40"
                />
            )}
            <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20 inline-flex items-center justify-center transform active:scale-95"
                aria-label="Add task"
            >
                <Plus className="w-5 h-5" />
            </button>
        </form>
    );
}
