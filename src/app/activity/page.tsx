"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, Loader2 } from "lucide-react";
import Link from "next/link";
import { UserActivityMetrics } from "@/components/UserActivityMetrics";

function ActivityContent() {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    // Handle redirect in useEffect to avoid "update while rendering" error
    useEffect(() => {
        if (!isPending && !session) {
            router.push("/login");
        }
    }, [session, isPending, router]);

    if (isPending || !session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
                <p className="text-slate-500 animate-pulse">
                    {!session && !isPending ? "Redirecting..." : "Loading activity..."}
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6 flex items-center gap-4">
                <Link
                    href="/"
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-900"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex items-center gap-3">
                    <BarChart3 className="text-blue-600" size={28} />
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Activity</h1>
                </div>
            </div>
            <p className="text-sm text-slate-500 mb-8">View your learning progress and activity metrics per book.</p>
            <Suspense fallback={<div className="text-center py-12"><p className="text-slate-500">Loading activity metrics...</p></div>}>
                <UserActivityMetrics />
            </Suspense>
        </div>
    );
}

export default function ActivityPage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                    <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
                    <p className="text-slate-500 animate-pulse">Loading activity...</p>
                </div>
            }
        >
            <ActivityContent />
        </Suspense>
    );
}


