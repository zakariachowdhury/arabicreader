import { Github } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-white border-t border-slate-100 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="text-slate-400 text-sm font-light">
                    © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME || "TaskFlow"}. Built with Next.js, Better Auth, Drizzle, and Neon.
                </p>
                <div className="mt-6 flex justify-center items-center gap-6">
                    <a
                        href="https://github.com/zakariachowdhury/nextjs-todo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <Github size={14} />
                        View Source
                    </a>
                    <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-light">Privacy</a>
                    <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-light">Terms</a>
                    <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-light">Twitter</a>
                </div>
            </div>
        </footer>
    );
}
