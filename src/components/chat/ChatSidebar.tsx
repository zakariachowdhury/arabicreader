"use client";

import { useState, useEffect } from "react";
import { getUserChatSessions, deleteChatSession, updateChatSessionTitle, searchChatSessions } from "@/app/actions";
import type { ChatSession } from "@/db/schema";
import { Plus, Search, Trash2, Edit2, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { ConfirmationModal } from "@/components/ConfirmationModal";

interface ChatSidebarProps {
    activeSessionId: number | null;
    onNewChat: () => void;
    onSelectSession: (sessionId: number) => void;
}

export function ChatSidebar({ activeSessionId, onNewChat, onSelectSession }: ChatSidebarProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setIsLoading(true);
            if (searchQuery.trim()) {
                const results = await searchChatSessions(searchQuery);
                setSessions(results);
            } else {
                const results = await getUserChatSessions();
                setSessions(results);
            }
        } catch (error) {
            console.error("Failed to load sessions:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadSessions();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleDeleteClick = (sessionId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingSessionId(sessionId);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingSessionId) return;
        
        try {
            await deleteChatSession(deletingSessionId);
            if (activeSessionId === deletingSessionId) {
                onNewChat();
            }
            setDeletingSessionId(null);
            loadSessions();
            router.refresh();
        } catch (error) {
            console.error("Failed to delete session:", error);
            toast.error("Failed to delete session. Please try again.");
            setDeletingSessionId(null);
        }
    };

    const handleStartEdit = (session: ChatSession, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSessionId(session.id);
        setEditTitle(session.title);
    };

    const handleSaveEdit = async (sessionId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await updateChatSessionTitle(sessionId, editTitle);
            setEditingSessionId(null);
            setEditTitle("");
            loadSessions();
            router.refresh();
        } catch (error) {
            console.error("Failed to update session title:", error);
            toast.error("Failed to update title. Please try again.");
        }
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSessionId(null);
        setEditTitle("");
    };

    const formatDate = (date: Date | string) => {
        const now = new Date();
        const sessionDate = typeof date === "string" ? new Date(date) : date;
        const diffInMs = now.getTime() - sessionDate.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) {
            return "Today";
        } else if (diffInDays === 1) {
            return "Yesterday";
        } else if (diffInDays < 7) {
            return `${diffInDays} days ago`;
        } else {
            return sessionDate.toLocaleDateString([], { month: "short", day: "numeric" });
        }
    };

    return (
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-slate-200">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Chat
                </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-200">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search chats..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                    />
                </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
                ) : sessions.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                        {searchQuery ? "No chats found" : "No chat sessions yet"}
                    </div>
                ) : (
                    <div className="p-2">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => onSelectSession(session.id)}
                                className={`group relative p-3 rounded-lg mb-1 cursor-pointer transition-colors ${
                                    activeSessionId === session.id
                                        ? "bg-blue-50 border border-blue-200"
                                        : "hover:bg-slate-50"
                                }`}
                            >
                                {editingSessionId === session.id ? (
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleSaveEdit(session.id, e as any);
                                                } else if (e.key === "Escape") {
                                                    handleCancelEdit(e as any);
                                                }
                                            }}
                                            className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            autoFocus
                                        />
                                        <button
                                            onClick={(e) => handleSaveEdit(session.id, e)}
                                            className="p-1 text-green-600 hover:text-green-700"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="p-1 text-red-600 hover:text-red-700"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                    {session.title}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {formatDate(session.updatedAt)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleStartEdit(session, e)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                                    title="Rename"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteClick(session.id, e)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={deletingSessionId !== null}
                onClose={() => setDeletingSessionId(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Chat Session"
                message="Are you sure you want to delete this chat session? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}

