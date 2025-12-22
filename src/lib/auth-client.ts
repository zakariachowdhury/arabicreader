import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
});

// @ts-ignore
export const { signIn, signUp, useSession, signOut, deleteUser, updateUser, forgetPassword, resetPassword, changePassword, sendVerificationEmail } = authClient;
