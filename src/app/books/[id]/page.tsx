import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getBookById, getUnitsByBook, getBookProgress, getUnitProgress } from "../../actions";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ProgressBar, ProgressBadge } from "@/components/ProgressIndicator";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const { id } = await params;
    const bookId = parseInt(id);

    if (isNaN(bookId)) {
        notFound();
    }

    const [book, units, bookProgress] = await Promise.all([
        getBookById(bookId),
        getUnitsByBook(bookId),
        getBookProgress(bookId),
    ]);

    if (!book) {
        notFound();
    }

    // Get progress for each unit
    const unitsWithProgress = await Promise.all(
        units.map(async (unit) => ({
            ...unit,
            progress: await getUnitProgress(unit.id),
        }))
    );

    const breadcrumbItems = [
        { label: "Books", href: "/books" },
        { label: book.title, href: `/books/${bookId}` },
    ];

    return (
        <main className="py-12 px-4 sm:px-6 lg:px-8 font-sans bg-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Breadcrumbs items={breadcrumbItems} />
                </div>
                <header className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
                            {book.title}
                        </h1>
                        {bookProgress.totalWords > 0 && (
                            <ProgressBadge progress={bookProgress} />
                        )}
                    </div>
                    {book.description && (
                        <p className="text-slate-500 mb-4">{book.description}</p>
                    )}
                    {bookProgress.totalWords > 0 && (
                        <div className="mt-4">
                            <ProgressBar progress={bookProgress} />
                        </div>
                    )}
                </header>

                {units.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg">No units available yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {unitsWithProgress.map((unit) => (
                            <Link
                                key={unit.id}
                                href={`/units/${unit.id}`}
                                className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 hover:shadow-xl transition-all hover:border-blue-200 group"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-4 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                                        <BookOpen className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-900">{unit.title}</h2>
                                                <p className="text-sm text-slate-500">Unit {unit.order + 1}</p>
                                            </div>
                                            {unit.progress.totalWords > 0 && (
                                                <ProgressBadge progress={unit.progress} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {unit.progress.totalWords > 0 && (
                                    <div className="mt-4">
                                        <ProgressBar progress={unit.progress} size="sm" />
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

