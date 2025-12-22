import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { resend } from "./resend";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "TaskFlow";

// Build trusted origins array for Vercel deployments
const getTrustedOrigins = (): string[] => {
    const origins: string[] = [];
    
    // Add BETTER_AUTH_URL if provided (should be set in Vercel env vars)
    if (process.env.BETTER_AUTH_URL) {
        origins.push(process.env.BETTER_AUTH_URL);
    }
    
    // Add VERCEL_URL (all deployments - preview and production)
    if (process.env.VERCEL_URL) {
        origins.push(`https://${process.env.VERCEL_URL}`);
    }
    
    // Add VERCEL_BRANCH_URL if available (branch-specific previews)
    if (process.env.VERCEL_BRANCH_URL) {
        origins.push(`https://${process.env.VERCEL_BRANCH_URL}`);
    }
    
    // Add production URL if available
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
        origins.push(`https://${process.env.NEXT_PUBLIC_VERCEL_URL}`);
    }
    
    // Add localhost for local development
    if (process.env.NODE_ENV === 'development') {
        origins.push('http://localhost:3000');
    }
    
    return origins.filter(Boolean);
};

const baseURL = process.env.BETTER_AUTH_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const auth = betterAuth({
    appName: appName,
    baseURL: baseURL,
    trustedOrigins: getTrustedOrigins(),
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.user,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
        },
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Allow login but show notification if not verified
        sendResetPassword: async ({ user, url, token }) => {
            // Ensure the URL includes the token parameter for the reset-password page
            const resetUrl = url.includes('token=') ? url : `${url}${url.includes('?') ? '&' : '?'}token=${token}`;
            
            await resend.emails.send({
                from: `${appName} <onboarding@resend.dev>`,
                to: [user.email],
                subject: `Reset your password for ${appName}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <h1 style="color: #1a202c; font-size: 24px; font-weight: bold; margin-bottom: 16px;">Reset your password</h1>
                        <p style="color: #4a5568; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                            You requested to reset your password for your ${appName} account. Click the button below to set a new password.
                        </p>
                        <a href="${resetUrl}" 
                           style="display: inline-block; background-color: #3182ce; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                            Reset Password
                        </a>
                        <p style="color: #ed8936; font-size: 14px; margin-top: 24px; padding: 12px; background-color: #fffaf0; border-radius: 6px; border: 1px solid #feebc8;">
                            <strong>Note:</strong> This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                        </p>
                        <hr style="margin: 32px 0; border: 0; border-top: 1px solid #e2e8f0;" />
                        <p style="color: #a0aec0; font-size: 12px; text-align: center;">
                            &copy; 2024 ${appName}. All rights reserved.
                        </p>
                    </div>
                `,
            });
        },
        sendVerificationEmail: async ({ user, url, token }: { user: { email: string; name: string }; url: string; token: string }) => {
            const verifyUrl = url.includes('token=') ? url : `${url}${url.includes('?') ? '&' : '?'}token=${token}`;
            
            await resend.emails.send({
                from: `${appName} <onboarding@resend.dev>`,
                to: [user.email],
                subject: `Verify your email for ${appName}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <h1 style="color: #1a202c; font-size: 24px; font-weight: bold; margin-bottom: 16px;">Verify your email</h1>
                        <p style="color: #4a5568; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                            Hi ${user.name},<br><br>
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
        },
    },
    user: {
        deleteUser: {
            enabled: true,
        },
    },
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    try {
                        await resend.emails.send({
                            from: `${appName} <onboarding@resend.dev>`,
                            to: [user.email],
                            subject: `Welcome to ${appName}!`,
                            html: `
                                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                                    <h1 style="color: #1a202c; font-size: 24px; font-weight: bold; margin-bottom: 16px;">Welcome, ${user.name}!</h1>
                                    <p style="color: #4a5568; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                                        We're thrilled to have you join ${appName}. Get started by creating your first task and stay organized!
                                    </p>
                                    <a href="${process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://taskflow-todo.vercel.app")}" 
                                       style="display: inline-block; background-color: #3182ce; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                                        Go to Dashboard
                                    </a>
                                    <hr style="margin: 32px 0; border: 0; border-top: 1px solid #e2e8f0;" />
                                    <p style="color: #a0aec0; font-size: 12px; text-align: center;">
                                        &copy; 2024 ${appName}. All rights reserved.
                                    </p>
                                </div>
                            `,
                        });
                    } catch (error) {
                        console.error("Failed to send welcome email:", error);
                    }
                },
            },
        },
    },
    // Explicitly pass the secret if the environment variable isn't being picked up correctly
    secret: process.env.BETTER_AUTH_SECRET,
});
