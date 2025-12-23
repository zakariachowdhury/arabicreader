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
        <main className="py-12 px-4 sm:px-6 lg:px-8 font-sans bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl shadow-lg">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight sm:text-5xl">
                                Admin Dashboard
                            </h1>
                            <p className="text-slate-600 mt-1 text-lg">Manage books, content, and users across ArabicReader</p>
                        </div>
                    </div>
                </header>

                {/* Book-Focused Stats Grid */}
                <div className="mb-12">
                    <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <Library className="w-5 h-5 text-indigo-600" />
                        Content Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-xl border border-indigo-400/20 p-6 text-white transform hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <BookOpen className="w-7 h-7" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold mb-1">{stats.totalBooks}</h3>
                            <p className="text-indigo-100 text-sm font-medium">Total Books</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl border border-blue-400/20 p-6 text-white transform hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <BookText className="w-7 h-7" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold mb-1">{stats.totalUnits}</h3>
                            <p className="text-blue-100 text-sm font-medium">Total Units</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl border border-purple-400/20 p-6 text-white transform hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <GraduationCap className="w-7 h-7" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold mb-1">{stats.totalLessons}</h3>
                            <p className="text-purple-100 text-sm font-medium">Total Lessons</p>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-xl border border-emerald-400/20 p-6 text-white transform hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <FileText className="w-7 h-7" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold mb-1">{stats.totalVocabulary}</h3>
                            <p className="text-emerald-100 text-sm font-medium">Vocabulary Words</p>
                        </div>
                    </div>
                </div>

                {/* Primary Action - Book Management */}
                <div className="mb-12">
                    <Link
                        href="/admin/books"
                        className="block bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-3xl shadow-2xl border border-indigo-400/30 p-10 hover:shadow-3xl transition-all hover:scale-[1.02] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-6">
                                    <div className="p-5 bg-white/20 backdrop-blur-sm rounded-2xl group-hover:scale-110 transition-transform">
                                        <BookOpen className="w-12 h-12 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-2">Book Management</h2>
                                        <p className="text-blue-100 text-lg">Create and manage books, units, lessons, and vocabulary</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white font-semibold">
                                        <span>Manage Content</span>
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-6">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <div className="text-2xl font-bold text-white mb-1">{stats.totalBooks}</div>
                                    <div className="text-blue-100 text-sm">Books</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <div className="text-2xl font-bold text-white mb-1">{stats.totalUnits}</div>
                                    <div className="text-blue-100 text-sm">Units</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <div className="text-2xl font-bold text-white mb-1">{stats.totalLessons}</div>
                                    <div className="text-blue-100 text-sm">Lessons</div>
                                </div>
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
                            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all hover:border-cyan-300 hover:-translate-y-1 group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-6 h-6 text-white" />
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
                            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all hover:border-blue-300 hover:-translate-y-1 group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <Users className="w-6 h-6 text-white" />
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
                            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all hover:border-emerald-300 hover:-translate-y-1 group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <CheckSquare className="w-6 h-6 text-white" />
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
                            className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all hover:border-pink-300 hover:-translate-y-1 group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl group-hover:scale-110 transition-transform">
                                    <Palette className="w-6 h-6 text-white" />
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

