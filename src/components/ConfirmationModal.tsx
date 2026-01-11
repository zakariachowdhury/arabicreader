"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    isPending?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "warning",
    isPending = false,
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
    };

    const handleClose = () => {
        if (!isPending) {
            onClose();
        }
    };

    const variantStyles = {
        danger: {
            icon: "text-red-600",
            button: "bg-red-600 hover:bg-red-700 text-white",
        },
        warning: {
            icon: "text-amber-600",
            button: "bg-amber-600 hover:bg-amber-700 text-white",
        },
        info: {
            icon: "text-blue-600",
            button: "bg-blue-600 hover:bg-blue-700 text-white",
        },
    };

    const styles = variantStyles[variant];

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className={`w-6 h-6 ${styles.icon} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 text-lg mb-2">{title}</h3>
                        <p className="text-sm text-slate-600">{message}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isPending}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors disabled:opacity-50"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={handleClose}
                        disabled={isPending}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isPending}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles.button}`}
                    >
                        {isPending ? "Processing..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}


