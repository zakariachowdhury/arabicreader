import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getAllUsers } from "../actions";
import { UserManagement } from "@/components/admin/UserManagement";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdminUsersPage() {
    const admin = await isAdmin();

    if (!admin) {
        redirect("/");
    }

    const users = await getAllUsers();

    return (
        <main className="py-12 px-4 sm:px-6 lg:px-8 font-sans bg-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>
                <header className="mb-10">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-2">
                        User Management
                    </h1>
                    <p className="text-slate-500">Manage all users and their permissions</p>
                </header>

                <UserManagement initialUsers={users} />
            </div>
        </main>
    );
}

