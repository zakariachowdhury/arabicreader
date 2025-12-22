"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton() {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/login");
                    router.refresh();
                },
            },
        });
    };

    return (
        <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl transition-all border border-slate-200 shadow-sm active:scale-95 text-sm font-medium"
        >
            <LogOut size={16} />
            <span>Logout</span>
        </button>
    );
}
