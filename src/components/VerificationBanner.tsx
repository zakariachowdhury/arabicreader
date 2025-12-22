"use client";

import { useState } from "react";
import { AlertCircle, Mail, X, Loader2, CheckCircle2 } from "lucide-react";
import { resendVerificationEmail } from "@/app/actions";

export function VerificationBanner({ email }: { email: string }) {
    const [isDismissed, setIsDismissed] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleResend = async () => {
        setIsSending(true);
        setMessage(null);
        
        const result = await resendVerificationEmail();
        
        if (result.error) {
            setMessage({ type: "error", text: result.error.message });
        } else {
            setMessage({ type: "success", text: "Verification email sent! Please check your inbox." });
        }
        
        setIsSending(false);
    };

    if (isDismissed) return null;

    return (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl relative">
            <button
                onClick={() => setIsDismissed(true)}
                className="absolute top-3 right-3 text-amber-600 hover:text-amber-700 transition-colors"
                aria-label="Dismiss"
            >
                <X size={18} />
            </button>
            
            <div className="flex items-start gap-3 pr-6">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-amber-900 mb-1">
                        Please verify your email address
                    </h3>
                    <p className="text-sm text-amber-800 mb-3">
                        We sent a verification email to <span className="font-semibold">{email}</span>. 
                        Please check your inbox and click the verification link to activate your account.
                    </p>
                    
                    {message && (
                        <div className={`mb-3 p-3 rounded-xl flex items-center gap-2 text-sm ${
                            message.type === "success" 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                            {message.type === "success" ? (
                                <CheckCircle2 size={16} />
                            ) : (
                                <AlertCircle size={16} />
                            )}
                            <span>{message.text}</span>
                        </div>
                    )}
                    
                    <button
                        onClick={handleResend}
                        disabled={isSending}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail size={16} />
                                Resend Verification Email
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

