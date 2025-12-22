"use client";

import { toggleTodo, deleteTodo } from "@/app/actions";
import { type Todo } from "@/db/schema";
import { Trash2, CheckCircle2, Circle } from "lucide-react";
import { useTransition } from "react";

export function TodoItem({ todo }: { todo: Todo }) {
    const [isPending, startTransition] = useTransition();

    return (
        <div className={`group flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white transition-all hover:border-slate-200 hover:shadow-md hover:shadow-slate-100/50 ${isPending ? 'opacity-50 grayscale' : ''}`}>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => startTransition(() => toggleTodo(todo.id, !todo.completed))}
                    className={`transition-colors ${todo.completed ? 'text-green-500' : 'text-slate-300 hover:text-slate-400'}`}
                >
                    {todo.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                <span className={`text-slate-700 transition-all ${todo.completed ? 'line-through text-slate-400' : ''}`}>
                    {todo.content}
                </span>
            </div>

            <button
                onClick={() => startTransition(() => deleteTodo(todo.id))}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                aria-label="Delete task"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}
