"use client";

import { useState } from "react";
import { DashboardTabs } from "@/components/DashboardTabs";
import { AddTodoForm } from "@/components/AddTodoForm";
import { TodoItem } from "@/components/TodoItem";
import { GroupManagement } from "@/components/GroupManagement";
import { type Group } from "@/db/schema";

type TodoWithGroup = {
    id: number;
    content: string;
    completed: boolean;
    userId: string;
    groupId: number | null;
    createdAt: Date;
    group: {
        id: number;
        name: string;
        color: string | null;
        description: string | null;
    } | null;
};

type DashboardContentProps = {
    todos: TodoWithGroup[];
    groups: Group[];
    todoCounts: Record<number, number>;
    defaultGroupId?: number | null;
};

export function DashboardContent({ todos, groups, todoCounts, defaultGroupId }: DashboardContentProps) {
    const [activeTab, setActiveTab] = useState<"tasks" | "groups">("tasks");

    // Group todos by their assigned group
    const todosByGroup = new Map<number | "uncategorized", TodoWithGroup[]>();
    const activeTodos = todos.filter(todo => !todo.completed);
    const completedTodos = todos.filter(todo => todo.completed);

    // Organize active todos by group
    activeTodos.forEach(todo => {
        const key = todo.groupId || "uncategorized";
        if (!todosByGroup.has(key)) {
            todosByGroup.set(key, []);
        }
        todosByGroup.get(key)!.push(todo);
    });

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="p-8">
                <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

                {activeTab === "tasks" ? (
                    <>
                        <AddTodoForm groups={groups} defaultGroupId={defaultGroupId} />

                        <div className="mt-12 space-y-10">
                            {/* Active Tasks - Grouped */}
                            {activeTodos.length === 0 ? (
                                <section>
                                    <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-slate-400 italic font-light">All caught up! Add a new task above.</p>
                                    </div>
                                </section>
                            ) : (
                                <>
                                    {/* Todos grouped by group */}
                                    {Array.from(todosByGroup.entries()).map(([groupId, groupTodos]) => {
                                        const group = groupId === "uncategorized" ? null : groups.find(g => g.id === groupId);
                                        return (
                                            <section key={groupId}>
                                                <div className="flex items-center justify-between mb-4 px-2">
                                                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                                                        {group ? group.name : "Uncategorized"}
                                                    </h2>
                                                    <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
                                                        {groupTodos.length}
                                                    </span>
                                                </div>
                                                <div className="space-y-3">
                                                    {groupTodos.map((todo) => (
                                                        <TodoItem key={todo.id} todo={todo} groups={groups} showGroupBadge={false} />
                                                    ))}
                                                </div>
                                            </section>
                                        );
                                    })}
                                </>
                            )}

                            {/* Completed Tasks */}
                            {completedTodos.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between mb-4 px-2">
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Completed</h2>
                                        <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">{completedTodos.length}</span>
                                    </div>
                                    <div className="space-y-3">
                                        {completedTodos.map((todo) => (
                                            <TodoItem key={todo.id} todo={todo} groups={groups} showGroupBadge={true} />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </>
                ) : (
                    <GroupManagement initialGroups={groups} todoCounts={todoCounts} defaultGroupId={defaultGroupId} />
                )}
            </div>
        </div>
    );
}

