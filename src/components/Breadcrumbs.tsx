"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
    label: string;
    href: string;
}

interface BreadcrumbsProps {
    items?: BreadcrumbItem[];
    className?: string;
}

// Default labels for common routes
const routeLabels: Record<string, string> = {
    admin: "Admin",
    books: "Books",
    units: "Units",
    lessons: "Lessons",
    vocabulary: "Vocabulary",
    reading: "Reading",
    conversation: "Conversation",
    learn: "Learn",
    practice: "Practice",
    test: "Test",
    tasks: "Tasks",
    activity: "Activity",
    settings: "Settings",
    analytics: "Analytics",
    users: "Users",
    todos: "Todos",
    groups: "Groups",
};

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
    const pathname = usePathname();

    // If custom items are provided, use them
    if (items && items.length > 0) {
        return (
            <nav
                className={`flex items-center gap-2 text-sm text-slate-600 ${className}`}
                aria-label="Breadcrumb"
            >
                <Link
                    href="/"
                    className="flex items-center hover:text-slate-900 transition-colors"
                    title="Home"
                >
                    <Home className="w-4 h-4" />
                </Link>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    return (
                        <div key={item.href} className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                            {isLast ? (
                                <span className="text-slate-900 font-medium">{item.label}</span>
                            ) : (
                                <Link
                                    href={item.href}
                                    className="hover:text-slate-900 transition-colors"
                                >
                                    {item.label}
                                </Link>
                            )}
                        </div>
                    );
                })}
            </nav>
        );
    }

    // Otherwise, generate breadcrumbs from pathname
    const pathSegments = pathname.split("/").filter(Boolean);
    
    // Don't show breadcrumbs on home page
    if (pathSegments.length === 0) {
        return null;
    }

    const breadcrumbItems: BreadcrumbItem[] = [];
    let currentPath = "";

    pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === pathSegments.length - 1;
        
        // Skip numeric IDs in auto-generation (they'll be replaced by custom labels)
        if (!isNaN(Number(segment))) {
            return;
        }

        const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        breadcrumbItems.push({
            label,
            href: currentPath,
        });
    });

    // If no breadcrumbs were generated (e.g., only numeric IDs), return null
    if (breadcrumbItems.length === 0) {
        return null;
    }

    return (
        <nav
            className={`flex items-center gap-2 text-sm text-slate-600 ${className}`}
            aria-label="Breadcrumb"
        >
            <Link
                href="/"
                className="flex items-center hover:text-slate-900 transition-colors"
                title="Home"
            >
                <Home className="w-4 h-4" />
            </Link>
            {breadcrumbItems.map((item, index) => {
                const isLast = index === breadcrumbItems.length - 1;
                return (
                    <div key={item.href} className="flex items-center gap-2">
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                        {isLast ? (
                            <span className="text-slate-900 font-medium">{item.label}</span>
                        ) : (
                            <Link
                                href={item.href}
                                className="hover:text-slate-900 transition-colors"
                            >
                                {item.label}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}

