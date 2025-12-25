import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getAllBooks } from "./actions";
import { BookManagement } from "@/components/admin/BookManagement";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function AdminBooksPage() {
    const admin = await isAdmin();

    if (!admin) {
        redirect("/");
    }

    const books = await getAllBooks();

    const breadcrumbItems = [
        { label: "Admin", href: "/admin" },
        { label: "Books", href: "/admin/books" },
    ];

    return (
        <main className="py-12 px-4 sm:px-6 lg:px-8 font-sans bg-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Breadcrumbs items={breadcrumbItems} />
                </div>
                <header className="mb-10">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-2">
                        Book Management
                    </h1>
                    <p className="text-slate-500">Manage books in the Arabic Reader series</p>
                </header>

                <BookManagement initialBooks={books} />
            </div>
        </main>
    );
}


