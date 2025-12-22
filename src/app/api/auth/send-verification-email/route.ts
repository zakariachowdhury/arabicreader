import { auth } from "@/lib/auth";
import { db } from "@/db";
import { verification, user } from "@/db/schema";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
    try {
        // Pass all headers from the incoming request to better-auth
        const requestHeaders = new Headers();
        request.headers.forEach((value, key) => {
            requestHeaders.set(key, value);
        });

        const session = await auth.api.getSession({
            headers: requestHeaders,
        });

        if (!session) {
            return NextResponse.json(
                { error: { message: "Unauthorized" } },
                { status: 401 }
            );
        }

        // Get user details
        const [userData] = await db
            .select()
            .from(user)
            .where(eq(user.id, session.user.id))
            .limit(1);

        if (!userData) {
            return NextResponse.json(
                { error: { message: "User not found" } },
                { status: 404 }
            );
        }

        // Generate verification token
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

        const baseURL = process.env.BETTER_AUTH_URL || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

        const verifyUrl = `${baseURL}/verify-email?token=${token}`;

        // Delete any existing verification tokens for this email
        await db
            .delete(verification)
            .where(eq(verification.identifier, userData.email));

        // Create new verification token
        await db.insert(verification).values({
            id: randomBytes(16).toString("hex"),
            identifier: userData.email,
            value: token,
            expiresAt: expiresAt,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Call the sendVerificationEmail function from auth config
        // We need to manually trigger it since better-auth endpoints aren't enabled
        const { resend } = await import("@/lib/resend");
        const appName = process.env.NEXT_PUBLIC_APP_NAME || "TaskFlow";

        await resend.emails.send({
            from: `${appName} <onboarding@resend.dev>`,
            to: [userData.email],
            subject: `Verify your email for ${appName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h1 style="color: #1a202c; font-size: 24px; font-weight: bold; margin-bottom: 16px;">Verify your email</h1>
                    <p style="color: #4a5568; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                        Hi ${userData.name},<br><br>
                        Thank you for signing up for ${appName}! Please verify your email address by clicking the button below.
                    </p>
                    <a href="${verifyUrl}" 
                       style="display: inline-block; background-color: #3182ce; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                        Verify Email
                    </a>
                    <p style="color: #ed8936; font-size: 14px; margin-top: 24px; padding: 12px; background-color: #fffaf0; border-radius: 6px; border: 1px solid #feebc8;">
                        <strong>Note:</strong> This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                    </p>
                    <hr style="margin: 32px 0; border: 0; border-top: 1px solid #e2e8f0;" />
                    <p style="color: #a0aec0; font-size: 12px; text-align: center;">
                        &copy; 2024 ${appName}. All rights reserved.
                    </p>
                </div>
            `,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error sending verification email:", error);
        return NextResponse.json(
            { error: { message: "Failed to send verification email" } },
            { status: 500 }
        );
    }
}

