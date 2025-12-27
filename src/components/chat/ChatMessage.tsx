"use client";

import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    navigationLinks?: Array<{ label: string; url: string }>;
}

export function ChatMessage({ role, content, timestamp, navigationLinks }: ChatMessageProps) {
    const isUser = role === "user";

    return (
        <div
            className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
        >
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                </div>
            )}
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isUser
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-slate-200 text-slate-900"
                }`}
            >
                <div className="text-sm break-words leading-relaxed">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            // Style code blocks
                            code: ({ node, className, children, ...props }) => {
                                const isInline = !className;
                                return isInline ? (
                                    <code
                                        className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                                            isUser
                                                ? "bg-blue-700 text-blue-100"
                                                : "bg-slate-100 text-slate-800"
                                        }`}
                                        {...props}
                                    >
                                        {children}
                                    </code>
                                ) : (
                                    <code
                                        className={`block p-3 rounded-lg text-xs font-mono overflow-x-auto ${
                                            isUser
                                                ? "bg-blue-700/50 text-blue-100"
                                                : "bg-slate-100 text-slate-800"
                                        }`}
                                        {...props}
                                    >
                                        {children}
                                    </code>
                                );
                            },
                            // Style pre blocks
                            pre: ({ children }) => {
                                return <pre className="my-2">{children}</pre>;
                            },
                            // Style links
                            a: ({ href, children }) => {
                                return (
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`underline hover:no-underline ${
                                            isUser
                                                ? "text-blue-100 hover:text-white"
                                                : "text-blue-600 hover:text-blue-700"
                                        }`}
                                    >
                                        {children}
                                    </a>
                                );
                            },
                            // Style lists
                            ul: ({ children }) => (
                                <ul className={`my-2 space-y-1 ${isUser ? "text-white" : "text-slate-900"}`}>
                                    {children}
                                </ul>
                            ),
                            ol: ({ children }) => (
                                <ol className={`my-2 space-y-1 ${isUser ? "text-white" : "text-slate-900"}`}>
                                    {children}
                                </ol>
                            ),
                            li: ({ children }) => (
                                <li className={`ml-4 ${isUser ? "text-white" : "text-slate-900"}`}>
                                    {children}
                                </li>
                            ),
                            // Style headings
                            h1: ({ children }) => (
                                <h1 className={`text-lg font-bold mt-3 mb-2 first:mt-0 ${isUser ? "text-white" : "text-slate-900"}`}>
                                    {children}
                                </h1>
                            ),
                            h2: ({ children }) => (
                                <h2 className={`text-base font-bold mt-3 mb-2 first:mt-0 ${isUser ? "text-white" : "text-slate-900"}`}>
                                    {children}
                                </h2>
                            ),
                            h3: ({ children }) => (
                                <h3 className={`text-sm font-bold mt-2 mb-1 first:mt-0 ${isUser ? "text-white" : "text-slate-900"}`}>
                                    {children}
                                </h3>
                            ),
                            // Style paragraphs
                            p: ({ children }) => (
                                <p className={`my-1.5 first:mt-0 last:mb-0 ${isUser ? "text-white" : "text-slate-900"}`}>
                                    {children}
                                </p>
                            ),
                            // Style blockquotes
                            blockquote: ({ children }) => (
                                <blockquote
                                    className={`my-2 pl-3 border-l-2 ${
                                        isUser
                                            ? "border-blue-400 text-blue-100"
                                            : "border-slate-300 text-slate-700"
                                    }`}
                                >
                                    {children}
                                </blockquote>
                            ),
                            // Style strong/bold
                            strong: ({ children }) => (
                                <strong className={`font-semibold ${isUser ? "text-white" : "text-slate-900"}`}>
                                    {children}
                                </strong>
                            ),
                            // Style emphasis/italic
                            em: ({ children }) => (
                                <em className={isUser ? "text-white" : "text-slate-900"}>
                                    {children}
                                </em>
                            ),
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
                
                {/* Show navigation links - only for assistant messages */}
                {!isUser && navigationLinks && Array.isArray(navigationLinks) && navigationLinks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs font-semibold text-slate-700 mb-2">Quick Links:</p>
                        <div className="flex flex-wrap gap-2">
                            {navigationLinks.map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link.url}
                                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
                
                <p className={`text-xs mt-2 ${isUser ? "opacity-80" : "opacity-60"}`}>
                    {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
            </div>
            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-700" />
                </div>
            )}
        </div>
    );
}

