import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserChatSessions } from "../actions";
import { ChatPageClient } from "@/components/chat/ChatPageClient";

export default async function ChatPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const sessions = await getUserChatSessions();

    return (
        <main className="flex h-[calc(100vh-140px)] min-h-[600px] bg-white">
            <ChatPageClient initialSessions={sessions} />
        </main>
    );
}

