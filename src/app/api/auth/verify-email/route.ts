import { db } from "@/db";
import { verification, user } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json(
                { error: { message: "Verification token is required" } },
                { status: 400 }
            );
        }

        // Find the verification record by token
        const [verificationRecord] = await db
            .select()
            .from(verification)
            .where(
                and(
                    eq(verification.value, token),
                    gt(verification.expiresAt, new Date())
                )
            )
            .limit(1);

        if (!verificationRecord) {
            return NextResponse.json(
                { error: { message: "Invalid or expired verification token" } },
                { status: 400 }
            );
        }

        // Find user by email (identifier)
        const [userData] = await db
            .select()
            .from(user)
            .where(eq(user.email, verificationRecord.identifier))
            .limit(1);

        if (!userData) {
            return NextResponse.json(
                { error: { message: "User not found" } },
                { status: 404 }
            );
        }

        // Update user's emailVerified status
        await db
            .update(user)
            .set({ 
                emailVerified: true,
                updatedAt: new Date()
            })
            .where(eq(user.id, userData.id));

        // Delete the verification token
        await db
            .delete(verification)
            .where(eq(verification.id, verificationRecord.id));

        return NextResponse.json({ 
            success: true,
            message: "Email verified successfully"
        });
    } catch (error) {
        console.error("Error verifying email:", error);
        return NextResponse.json(
            { error: { message: "Failed to verify email" } },
            { status: 500 }
        );
    }
}

