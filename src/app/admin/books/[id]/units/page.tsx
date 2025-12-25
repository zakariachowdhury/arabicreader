import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getUnitsByBook, getBookById } from "../../../actions";
import { UnitManagement } from "@/components/admin/UnitManagement";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function AdminUnitsPage({ params }: { params: Promise<{ id: string }> }) {
    const admin = await isAdmin();

    if (!admin) {
        redirect("/");
    }

    const { id } = await params;
    const bookId = parseInt(id);

    if (isNaN(bookId)) {
        notFound();
    }

    const [units, book] = await Promise.all([
        getUnitsByBook(bookId),
        getBookById(bookId),
    ]);

    if (!book) {
        notFound();
    }

    const breadcrumbItems = [
        { label: "Admin", href: "/admin" },
        { label: "Books", href: "/admin/books" },
        { label: book.title, href: `/admin/books/${bookId}/units` },
    ];

    return (
        <main className="py-12 px-4 sm:px-6 lg:px-8 font-sans bg-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Breadcrumbs items={breadcrumbItems} />
                </div>
                <header className="mb-10">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-2">
                        Units
                    </h1>
                    <p className="text-slate-500">Manage units for this book</p>
                </header>

                <UnitManagement initialUnits={units} bookId={bookId} />
            </div>
        </main>
    );
}


