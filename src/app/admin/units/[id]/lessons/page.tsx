import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getUnitById, getBookById } from "../../actions";
import { getLessonsByUnit } from "../../../lessons/actions";
import { LessonManagement } from "@/components/admin/LessonManagement";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function AdminLessonsPage({ params }: { params: Promise<{ id: string }> }) {
    const admin = await isAdmin();

    if (!admin) {
        redirect("/");
    }

    const { id } = await params;
    const unitId = parseInt(id);

    if (isNaN(unitId)) {
        notFound();
    }

    const [lessons, unit] = await Promise.all([
        getLessonsByUnit(unitId),
        getUnitById(unitId),
    ]);

    if (!unit) {
        notFound();
    }

    const book = await getBookById(unit.bookId);
    
    const breadcrumbItems = [
        { label: "Admin", href: "/admin" },
        { label: "Books", href: "/admin/books" },
        ...(book ? [{ label: book.title, href: `/admin/books/${book.id}/units` }] : []),
        { label: unit.title, href: `/admin/units/${unitId}/lessons` },
    ];

    return (
        <main className="py-12 px-4 sm:px-6 lg:px-8 font-sans bg-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Breadcrumbs items={breadcrumbItems} />
                </div>
                <header className="mb-10">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-2">
                        Lessons
                    </h1>
                    <p className="text-slate-500">Manage lessons for this unit</p>
                </header>

                <LessonManagement initialLessons={lessons} unitId={unitId} />
            </div>
        </main>
    );
}

