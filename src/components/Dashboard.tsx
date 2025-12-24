import { getTodos, getGroups, getDefaultGroup } from "@/app/actions";
import { VerificationBanner } from "@/components/VerificationBanner";
import { DashboardContent } from "@/components/DashboardContent";

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

export async function Dashboard({ user }: { user: { name: string; email: string; emailVerified: boolean } }) {
    const [todos, groups, defaultGroup] = await Promise.all([getTodos(), getGroups(), getDefaultGroup()]);

    // Calculate todo counts per group
    const todoCounts: Record<number, number> = {};
    todos.forEach(todo => {
        if (todo.groupId) {
            todoCounts[todo.groupId] = (todoCounts[todo.groupId] || 0) + 1;
        }
    });

    return (
        <main className="py-12 px-4 sm:px-6 lg:px-8 font-sans bg-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-2">
                        Your Tasks
                    </h1>
                    <p className="text-slate-500">Organize your tasks and track your progress</p>
                </header>

                {!user.emailVerified && (
                    <VerificationBanner email={user.email} />
                )}

                <DashboardContent todos={todos} groups={groups} todoCounts={todoCounts} defaultGroupId={defaultGroup?.id || null} />
            </div>
        </main>
    );
}
