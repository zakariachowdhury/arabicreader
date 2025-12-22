import { getTodos } from "./actions";
import { AddTodoForm } from "@/components/AddTodoForm";
import { TodoItem } from "@/components/TodoItem";

export default async function Home() {
  const todos = await getTodos();

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-2">
            Tasks
          </h1>
          <p className="text-slate-600">Stay organized and get things done.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-6 sm:p-8">
            <AddTodoForm />

            <div className="mt-8 space-y-3">
              {todos.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-400 italic">No tasks yet. Add one above!</p>
                </div>
              ) : (
                todos.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))
              )}
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-slate-400 text-sm">
          Built with Next.js, Drizzle, and Neon
        </footer>
      </div>
    </main>
  );
}
