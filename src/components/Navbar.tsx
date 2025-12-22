import Link from "next/link";
import { CheckCircle2, Github, Settings, Shield } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SignOutButton } from "./SignOutButton";
import { isAdmin } from "@/lib/admin";

export async function Navbar() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const admin = session ? await isAdmin() : false;

    return (
        <nav className="bg-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                            <CheckCircle2 className="text-white w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">{process.env.NEXT_PUBLIC_APP_NAME || "TaskFlow"}</span>
                    </Link>
                    <a
                        href="https://github.com/zakariachowdhury/nextjs-todo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:flex items-center gap-2 text-sm text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <span className="font-medium">GitHub</span>
                    </a>
                </div>
                <div className="flex items-center gap-4">
                    {session ? (
                        <div className="flex items-center gap-4">
                            <span className="hidden sm:inline text-sm text-slate-500 font-light">
                                <span className="text-slate-900 font-medium">{session.user.name}</span>
                            </span>
                            {admin && (
                                <Link
                                    href="/admin"
                                    className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all"
                                    title="Admin Dashboard"
                                >
                                    <Shield size={20} />
                                </Link>
                            )}
                            <Link
                                href="/settings"
                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                                title="Settings"
                            >
                                <Settings size={20} />
                            </Link>
                            <SignOutButton />
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                Sign In
                            </Link>
                            <Link href="/signup" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
