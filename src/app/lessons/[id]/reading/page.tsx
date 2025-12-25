import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getLessonById, getConversationSentencesByLesson, getUnitById, getBookById } from "../../../actions";
import { ReadingDisplay } from "@/components/ReadingDisplay";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function ReadingLessonPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const { id } = await params;
    const lessonId = parseInt(id);

    if (isNaN(lessonId)) {
        notFound();
    }

    const [lesson, sentences] = await Promise.all([
        getLessonById(lessonId),
        getConversationSentencesByLesson(lessonId),
    ]);

    if (!lesson) {
        notFound();
    }

    if (lesson.type !== "reading") {
        redirect(`/units/${lesson.unitId}`);
    }

    // Get unit and book for breadcrumb
    const unit = await getUnitById(lesson.unitId);
    const book = unit ? await getBookById(unit.bookId) : null;

    const breadcrumbItems = [
        { label: "Books", href: "/books" },
        ...(book ? [{ label: book.title, href: `/books/${book.id}` }] : []),
        ...(unit ? [{ label: unit.title, href: `/units/${unit.id}` }] : []),
        { label: "Reading", href: `/lessons/${lessonId}/reading` },
    ];

    return (
        <main className="py-12 px-4 sm:px-6 lg:px-8 font-sans bg-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Breadcrumbs items={breadcrumbItems} />
                </div>
                <header className="mb-10">
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-2">
                                {lesson.title}
                            </h1>
                        </div>
                    </div>
                </header>

                <ReadingDisplay sentences={sentences} />
            </div>
        </main>
    );
}


