import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getAllGroups } from "../actions";
import { GroupManagement } from "@/components/admin/GroupManagement";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function AdminGroupsPage() {
    const admin = await isAdmin();

    if (!admin) {
        redirect("/");
    }

    const groups = await getAllGroups();

    const breadcrumbItems = [
        { label: "Admin", href: "/admin" },
        { label: "Groups", href: "/admin/groups" },
    ];

    return (
        <main className="py-12 px-4 sm:px-6 lg:px-8 font-sans bg-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Breadcrumbs items={breadcrumbItems} />
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

