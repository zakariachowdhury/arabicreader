import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getAdminStats, getGlobalAIEnabled } from "./actions";
import Link from "next/link";
import { Users, CheckSquare, UserCheck, BarChart3, Palette, BookOpen, TrendingUp, Library, BookText, GraduationCap, FileText } from "lucide-react";
import { GlobalAIToggle } from "@/components/admin/GlobalAIToggle";

export default async function AdminPage() {
    const admin = await isAdmin();

    if (!admin) {
        redirect("/");
    }

    const stats = await getAdminStats();
    const globalAIEnabled = await getGlobalAIEnabled();

    return (
        <main className="py-12 px-4 sm:px-6 lg:px-8 font-sans bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-slate-800 rounded-2xl shadow-lg">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
                                Admin Dashboard
                            </h1>
                            <p className="text-slate-600 mt-1 text-lg">Manage books, content, and users across ArabicReader</p>
                        </div>
                    </div>
                </header>

                {/* Book-Focused Stats Grid */}
                <div className="mb-12">
                    <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <Library className="w-5 h-5 text-slate-600" />
                        Content Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-slate-100 rounded-xl">
                                    <BookOpen className="w-7 h-7 text-slate-700" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold mb-1 text-slate-900">{stats.totalBooks}</h3>
                            <p className="text-slate-600 text-sm font-medium">Total Books</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-slate-100 rounded-xl">
                                    <BookText className="w-7 h-7 text-slate-700" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold mb-1 text-slate-900">{stats.totalUnits}</h3>
                            <p className="text-slate-600 text-sm font-medium">Total Units</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-slate-100 rounded-xl">
                                    <GraduationCap className="w-7 h-7 text-slate-700" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold mb-1 text-slate-900">{stats.totalLessons}</h3>
                            <p className="text-slate-600 text-sm font-medium">Total Lessons</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-slate-100 rounded-xl">
                                    <FileText className="w-7 h-7 text-slate-700" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold mb-1 text-slate-900">{stats.totalVocabulary}</h3>
                            <p className="text-slate-600 text-sm font-medium">Vocabulary Words</p>
                        </div>
                    </div>
                </div>

                {/* Primary Action - Book Management */}
                <div className="mb-12">
                    <Link
                        href="/admin/books"
                        className="block bg-white rounded-2xl shadow-lg border border-slate-200 p-10 hover:shadow-xl transition-all hover:border-slate-300 group"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-slate-100 rounded-2xl group-hover:bg-slate-200 transition-colors">
                                    <BookOpen className="w-12 h-12 text-slate-700" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Book Management</h2>
                                    <p className="text-slate-600 text-lg">Create and manage books, units, lessons, and vocabulary</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-slate-700 font-semibold group-hover:bg-slate-200 transition-colors">
                                    <span>Manage Content</span>
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.totalBooks}</div>
                                <div className="text-slate-600 text-sm">Books</div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.totalUnits}</div>
                                <div className="text-slate-600 text-sm">Units</div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.totalLessons}</div>
                                <div className="text-slate-600 text-sm">Lessons</div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Global AI Settings */}
                <div className="mb-12">
                    <GlobalAIToggle initialEnabled={globalAIEnabled} />
                </div>

                {/* Secondary Management Tools */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-slate-600" />
                        Platform Management
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Link
                            href="/admin/analytics"
                            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all hover:border-slate-300 group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
                                    <TrendingUp className="w-6 h-6 text-slate-700" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Analytics</h3>
                                    <p className="text-slate-500 text-sm">View metrics</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">
                                Track activity and performance
                            </p>
                        </Link>

                        <Link
                            href="/admin/users"
                            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all hover:border-slate-300 group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
                                    <Users className="w-6 h-6 text-slate-700" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Users</h3>
                                    <p className="text-slate-500 text-sm">{stats.totalUsers} total</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">
                                Manage accounts & permissions
                            </p>
                        </Link>

                        <Link
                            href="/admin/todos"
                            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all hover:border-slate-300 group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
                                    <CheckSquare className="w-6 h-6 text-slate-700" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Todos</h3>
                                    <p className="text-slate-500 text-sm">{stats.totalTodos} total</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">
                                Manage user tasks
                            </p>
                        </Link>

                        <Link
                            href="/admin/groups"
                            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all hover:border-slate-300 group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
                                    <Palette className="w-6 h-6 text-slate-700" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Groups</h3>
                                    <p className="text-slate-500 text-sm">{stats.totalGroups} total</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">
                                Manage user groups
                            </p>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

