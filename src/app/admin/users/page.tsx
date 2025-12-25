import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getAllUsers } from "../actions";
import { UserManagement } from "@/components/admin/UserManagement";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function AdminUsersPage() {
    const admin = await isAdmin();

    if (!admin) {
        redirect("/");
    }

    const users = await getAllUsers();

    const breadcrumbItems = [
        { label: "Admin", href: "/admin" },
        { label: "Users", href: "/admin/users" },
    ];

    return (
        <main className="py-12 px-4 sm:px-6 lg:px-8 font-sans bg-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Breadcrumbs items={breadcrumbItems} />
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

