"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/app/actions";
import Link from "next/link";
import { AlertCircle, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const { error } = await requestPasswordReset(email, "/reset-password");

        if (error) {
            setError(error.message || "Something went wrong. Please try again.");
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12 px-4 bg-white">
            <div className="w-full max-w-md p-10 bg-white rounded-[2rem] shadow-2xl shadow-blue-500/5 border border-slate-100">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors mb-8 text-sm font-medium group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Login
                </Link>

                <h1 className="text-3xl font-extrabold mb-2 text-center text-slate-900 tracking-tight">
                    Reset Password
                </h1>
                <p className="text-slate-500 text-center mb-10 font-light">
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
                        <AlertCircle size={18} />
                        <p>{error}</p>
                    </div>
                )}

                {success ? (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full mb-6">
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
                        <p className="text-slate-500 mb-8">
                            We've sent a password reset link to <span className="font-semibold text-slate-900">{email}</span>.
                        </p>
                        <Link
                            href="/login"
                            className="w-full block p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all active:scale-95"
                        >
                            Return to Sign In
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-300"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/20 mt-4 flex items-center justify-center gap-2 active:scale-95"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                "Send Reset Link"
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
