"use client";

import { useState } from "react";
import { BookOpen, GraduationCap, Languages, ChevronDown, ChevronUp } from "lucide-react";

interface BookStats {
    units: number;
    lessons: number;
    vocabularyWords: number;
}

interface Book {
    id: number;
    title: string;
    description?: string | null;
    stats: BookStats;
    [key: string]: unknown; // Allow additional properties
}

interface BooksSectionProps {
    books: Book[];
}

export function BooksSection({ books }: BooksSectionProps) {
    const [showAll, setShowAll] = useState(false);
    const maxInitialBooks = 4;
    const displayedBooks = showAll ? books : books.slice(0, maxInitialBooks);
    const hasMoreBooks = books.length > maxInitialBooks;

    if (books.length === 0) {
        return (
            <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No books available yet.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedBooks.map((book) => (
                    <div
                        key={book.id}
                        className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 hover:shadow-xl transition-all hover:border-blue-200"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-4 bg-blue-100 rounded-xl">
                                <BookOpen className="w-8 h-8 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-slate-900">{book.title}</h3>
                            </div>
                        </div>
                        
                        {book.description && (
                            <p className="text-sm text-slate-600 mb-6 line-clamp-3">
                                {book.description}
                            </p>
                        )}

                        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <BookOpen className="w-4 h-4 text-blue-600" />
                                    <span className="text-2xl font-bold text-slate-900">{book.stats.units}</span>
                                </div>
                                <p className="text-xs text-slate-500">Units</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <GraduationCap className="w-4 h-4 text-purple-600" />
                                    <span className="text-2xl font-bold text-slate-900">{book.stats.lessons}</span>
                                </div>
                                <p className="text-xs text-slate-500">Lessons</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Languages className="w-4 h-4 text-emerald-600" />
                                    <span className="text-2xl font-bold text-slate-900">{book.stats.vocabularyWords}</span>
                                </div>
                                <p className="text-xs text-slate-500">Words</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {hasMoreBooks && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all border border-blue-200 shadow-md hover:shadow-lg"
                    >
                        {showAll ? (
                            <>
                                Show Less
                                <ChevronUp className="w-5 h-5" />
                            </>
                        ) : (
                            <>
                                See All Books ({books.length})
                                <ChevronDown className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            )}
        </>
    );
}

