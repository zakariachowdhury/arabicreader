import { db } from "@/db";
import { user, verification, account } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { token, newPassword } = body;

        if (!token) {
            return Response.json(
                { error: { message: "Token is required" } },
                { status: 400 }
            );
        }

        if (!newPassword) {
            return Response.json(
                { error: { message: "New password is required" } },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return Response.json(
                { error: { message: "Password must be at least 8 characters long" } },
                { status: 400 }
            );
        }

        // Find the verification token
        const [verificationRecord] = await db
            .select()
            .from(verification)
            .where(
                and(
                    eq(verification.value, token),
                    eq(verification.identifier, verification.identifier) // This will be filtered by the token
                )
            )
            .limit(1);

        if (!verificationRecord) {
            return Response.json(
                { error: { message: "Invalid or expired reset token" } },
                { status: 400 }
            );
        }

        // Check if token has expired
        if (new Date() > new Date(verificationRecord.expiresAt)) {
            // Delete expired token
            await db.delete(verification).where(eq(verification.id, verificationRecord.id));
            return Response.json(
                { error: { message: "Reset token has expired. Please request a new one." } },
                { status: 400 }
            );
        }

        // Find user by email (identifier is the email)
        const [foundUser] = await db
            .select()
            .from(user)
            .where(eq(user.email, verificationRecord.identifier))
            .limit(1);

        if (!foundUser) {
            return Response.json(
                { error: { message: "User not found" } },
                { status: 400 }
            );
        }

        // Find the account for this user with email/password provider
        const [userAccount] = await db
            .select()
            .from(account)
            .where(
                and(
                    eq(account.userId, foundUser.id),
                    eq(account.providerId, "credential")
                )
            )
            .limit(1);

        if (!userAccount) {
            return Response.json(
                { error: { message: "Account not found" } },
                { status: 400 }
            );
        }

        // Hash the new password (Better Auth uses bcrypt with 10 rounds)
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password in the account table
        await db
            .update(account)
            .set({
                password: hashedPassword,
                updatedAt: new Date(),
            })
            .where(eq(account.id, userAccount.id));

        // Delete the used verification token
        await db.delete(verification).where(eq(verification.id, verificationRecord.id));

        return Response.json({ success: true });
    } catch (error) {
        console.error("Reset password error:", error);
        return Response.json(
            { error: { message: "Failed to reset password. Please try again." } },
            { status: 500 }
        );
    }
}
