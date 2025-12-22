"use client";

import { useRef } from "react";
import { addTodo } from "@/app/actions";
import { Plus } from "lucide-react";

export function AddTodoForm() {
    const formRef = useRef<HTMLFormElement>(null);

    async function clientAction(formData: FormData) {
        await addTodo(formData);
        formRef.current?.reset();
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
            <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20 inline-flex items-center justify-center"
                aria-label="Add task"
            >
                <Plus className="w-5 h-5" />
            </button>
        </form>
    );
}
