import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) return false;

    try {
        const currentUser = await db
            .select({ isAdmin: user.isAdmin })
            .from(user)
            .where(eq(user.id, session.user.id))
            .limit(1);

        return currentUser[0]?.isAdmin ?? false;
    } catch (error) {
        console.error("Failed to check admin status:", error);
        return false;
    }
}

/**
 * Require admin access - throws error if user is not admin
 */
export async function requireAdmin() {
    const admin = await isAdmin();
    if (!admin) {
        throw new Error("Unauthorized: Admin access required");
    }
}

