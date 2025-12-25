import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getConversationSentencesByLesson, getLessonById } from "./actions";
import { getUnitById, getBookById } from "../../../actions";
import { ConversationManagement } from "@/components/admin/ConversationManagement";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function AdminConversationPage({ params }: { params: Promise<{ id: string }> }) {
    const admin = await isAdmin();

    if (!admin) {
        redirect("/");
    }

    const { id } = await params;
    const lessonId = parseInt(id);

    if (isNaN(lessonId)) {
        notFound();
    }

    const [sentences, lesson] = await Promise.all([
        getConversationSentencesByLesson(lessonId),
        getLessonById(lessonId),
    ]);

    if (!lesson) {
        notFound();
    }

    if (lesson.type !== "conversation") {
        redirect(`/admin/units/${lesson.unitId}/lessons`);
    }

    const unit = await getUnitById(lesson.unitId);
    const book = unit ? await getBookById(unit.bookId) : null;

    const breadcrumbItems = [
        { label: "Admin", href: "/admin" },
        { label: "Books", href: "/admin/books" },
        ...(book ? [{ label: book.title, href: `/admin/books/${book.id}/units` }] : []),
        ...(unit ? [{ label: unit.title, href: `/admin/units/${unit.id}/lessons` }] : []),
        { label: "Conversation", href: `/admin/lessons/${lessonId}/conversation` },
    ];

    return (
        <main className="py-12 px-4 sm:px-6 lg:px-8 font-sans bg-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Breadcrumbs items={breadcrumbItems} />
                </div>
                <header className="mb-10">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-2">
                        {lesson.title}
                    </h1>
                    <p className="text-slate-500">Manage Arabic conversation sentences with optional English translations for this lesson</p>
                </header>

                <ConversationManagement initialSentences={sentences} lessonId={lessonId} lessonTitle={lesson.title} categoryName={lesson.type} />
            </div>
        </main>
    );
}


