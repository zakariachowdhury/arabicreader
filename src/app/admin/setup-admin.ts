/**
 * Script to set up the first admin user
 * 
 * Usage:
 * 1. Run database migration first: npx drizzle-kit push
 * 2. Then run this script: npx tsx src/app/admin/setup-admin.ts <user-email>
 * 
 * Or use it programmatically:
 * import { setupAdmin } from './setup-admin';
 * await setupAdmin('user@example.com');
 */

import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function setupAdmin(userEmail: string) {
    try {
        const [targetUser] = await db
            .select()
            .from(user)
            .where(eq(user.email, userEmail))
            .limit(1);

        if (!targetUser) {
            throw new Error(`User with email ${userEmail} not found`);
        }

        await db
            .update(user)
            .set({ 
                isAdmin: true,
                updatedAt: new Date(),
            })
            .where(eq(user.id, targetUser.id));

        console.log(`✅ Successfully set ${userEmail} as admin`);
        return { success: true };
    } catch (error) {
        console.error("❌ Failed to set admin:", error);
        throw error;
    }
}

// CLI usage
if (require.main === module) {
    const email = process.argv[2];
    if (!email) {
        console.error("Usage: npx tsx src/app/admin/setup-admin.ts <user-email>");
        process.exit(1);
    }
    setupAdmin(email)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

