"use client";

import { useState, useEffect, Suspense } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";

function ResetPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing reset token.");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setError("Invalid or missing reset token.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        setLoading(true);
        setError(null);

        const { error } = await authClient.resetPassword({
            newPassword: password,
            token: token,
        });

        if (error) {
            setError(error.message || "Failed to reset password. The link may have expired.");
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        }
    };

    if (!token && !error) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    return (
        <div className="w-full max-w-md p-10 bg-white rounded-[2rem] shadow-2xl shadow-blue-500/5 border border-slate-100">
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <ShieldCheck size={32} />
                </div>
            </div>

            <h1 className="text-3xl font-extrabold mb-2 text-center text-slate-900 tracking-tight">
                New Password
            </h1>
            <p className="text-slate-500 text-center mb-10 font-light">
                Please enter your new password below.
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
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Password Reset!</h2>
                    <p className="text-slate-500 mb-8">
                        Your password has been successfully updated. Redirecting you to login...
                    </p>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 animate-progress origin-left"></div>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-300"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-300"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !!error}
                        className="w-full p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/20 mt-4 flex items-center justify-center gap-2 active:scale-95"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            "Update Password"
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12 px-4 bg-white">
            <Suspense fallback={<Loader2 className="animate-spin text-blue-600" size={40} />}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
