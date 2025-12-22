import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getAllGroups } from "../actions";
import { GroupManagement } from "@/components/admin/GroupManagement";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AdminGroupsPage() {
    const admin = await isAdmin();

    if (!admin) {
        redirect("/");
    }

    const groups = await getAllGroups();

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
                        Group Management
                    </h1>
                    <p className="text-slate-500">Manage all groups across the platform</p>
                </header>

                <GroupManagement initialGroups={groups} />
            </div>
        </main>
    );
}

