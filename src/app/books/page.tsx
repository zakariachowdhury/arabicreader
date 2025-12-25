import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getBooks, getAllBooksProgress } from "../actions";
import Link from "next/link";
import { BookOpen, BarChart3 } from "lucide-react";
import { ProgressBar, ProgressBadge } from "@/components/ProgressIndicator";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function BooksPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const [books, booksProgress] = await Promise.all([
        getBooks(),
        getAllBooksProgress(),
    ]);

    const breadcrumbItems = [
        { label: "Books", href: "/books" },
    ];

    return (
        <main className="py-12 px-4 sm:px-6 lg:px-8 font-sans bg-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Breadcrumbs items={breadcrumbItems} />
                </div>
                <header className="mb-10">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-2">
                        Books
                    </h1>
                    <p className="text-slate-500">Choose a book to start learning</p>
                </header>

                {books.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg">No books available yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {books.map((book) => {
                            const progress = booksProgress[book.id] || {
                                totalWords: 0,
                                wordsSeen: 0,
                                wordsMastered: 0,
                                completionPercentage: 0,
                                lastActivityDate: null,
                            };
                            
                            return (
                                <div
                                    key={book.id}
                                    className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 hover:shadow-xl transition-all hover:border-blue-200 group"
                                >
                                    <Link
                                        href={`/books/${book.id}`}
                                        className="block"
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-4 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                                                <BookOpen className="w-8 h-8 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h2 className="text-2xl font-bold text-slate-900">{book.title}</h2>
                                                    {progress.totalWords > 0 && (
                                                        <ProgressBadge progress={progress} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {book.description && (
                                            <p className="text-sm text-slate-600 mt-4 line-clamp-3 mb-4">
                                                {book.description}
                                            </p>
                                        )}
                                        {progress.totalWords > 0 && (
                                            <div className="mt-4">
                                                <ProgressBar progress={progress} size="sm" />
                                            </div>
                                        )}
                                    </Link>
                                    <div className="mt-4 flex items-center justify-end">
                                        <Link
                                            href={`/activity?bookId=${book.id}`}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all"
                                            title="View activity for this book"
                                        >
                                            <BarChart3 size={16} />
                                            <span>Activity</span>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}

