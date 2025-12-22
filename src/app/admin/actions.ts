"use server";

import { db } from "@/db";
import { user, todos, groups, settings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// User Management Actions
export async function getAllUsers() {
    await requireAdmin();

    try {
        return await db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                isAdmin: user.isAdmin,
                aiEnabled: user.aiEnabled,
                defaultGroupId: user.defaultGroupId,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            })
            .from(user)
            .orderBy(desc(user.createdAt));
    } catch (error) {
        console.error("Failed to fetch users:", error);
        throw new Error("Failed to fetch users");
    }
}

export async function updateUser(userId: string, data: { name?: string; email?: string; isAdmin?: boolean; aiEnabled?: boolean }) {
    await requireAdmin();

    try {
        await db
            .update(user)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(user.id, userId));
        revalidatePath("/admin/users");
        revalidatePath("/admin");
    } catch (error) {
        console.error("Failed to update user:", error);
        throw new Error("Failed to update user");
    }
}

export async function deleteUser(userId: string) {
    await requireAdmin();

    try {
        // First delete all todos for this user
        await db.delete(todos).where(eq(todos.userId, userId));
        // Then delete the user
        await db.delete(user).where(eq(user.id, userId));
        revalidatePath("/admin/users");
        revalidatePath("/admin");
    } catch (error) {
        console.error("Failed to delete user:", error);
        throw new Error("Failed to delete user");
    }
}

// Todo Management Actions
export async function getAllTodos() {
    await requireAdmin();

    try {
        return await db
            .select({
                id: todos.id,
                content: todos.content,
                completed: todos.completed,
                userId: todos.userId,
                groupId: todos.groupId,
                createdAt: todos.createdAt,
                user: {
                    name: user.name,
                    email: user.email,
                },
                group: {
                    id: groups.id,
                    name: groups.name,
                    color: groups.color,
                },
            })
            .from(todos)
            .leftJoin(user, eq(todos.userId, user.id))
            .leftJoin(groups, eq(todos.groupId, groups.id))
            .orderBy(desc(todos.createdAt));
    } catch (error) {
        console.error("Failed to fetch todos:", error);
        throw new Error("Failed to fetch todos");
    }
}

export async function adminUpdateTodo(id: number, data: { content?: string; completed?: boolean }) {
    await requireAdmin();

    try {
        await db
            .update(todos)
            .set(data)
            .where(eq(todos.id, id));
        revalidatePath("/admin/todos");
        revalidatePath("/admin");
    } catch (error) {
        console.error("Failed to update todo:", error);
        throw new Error("Failed to update todo");
    }
}

export async function adminDeleteTodo(id: number) {
    await requireAdmin();

    try {
        await db.delete(todos).where(eq(todos.id, id));
        revalidatePath("/admin/todos");
        revalidatePath("/admin");
    } catch (error) {
        console.error("Failed to delete todo:", error);
        throw new Error("Failed to delete todo");
    }
}

export async function getAdminStats() {
    await requireAdmin();

    try {
        const allUsers = await db.select().from(user);
        const allTodos = await db.select().from(todos);
        const allGroups = await db.select().from(groups);
        const completedTodos = allTodos.filter(t => t.completed);
        const adminUsers = allUsers.filter(u => u.isAdmin);

        return {
            totalUsers: allUsers.length,
            totalTodos: allTodos.length,
            completedTodos: completedTodos.length,
            totalAdmins: adminUsers.length,
            totalGroups: allGroups.length,
        };
    } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        return {
            totalUsers: 0,
            totalTodos: 0,
            completedTodos: 0,
            totalAdmins: 0,
            totalGroups: 0,
        };
    }
}

// Group Management Actions
export async function getAllGroups() {
    await requireAdmin();

    try {
        return await db
            .select({
                id: groups.id,
                name: groups.name,
                color: groups.color,
                description: groups.description,
                userId: groups.userId,
                createdAt: groups.createdAt,
                updatedAt: groups.updatedAt,
                user: {
                    name: user.name,
                    email: user.email,
                },
            })
            .from(groups)
            .leftJoin(user, eq(groups.userId, user.id))
            .orderBy(desc(groups.createdAt));
    } catch (error) {
        console.error("Failed to fetch groups:", error);
        throw new Error("Failed to fetch groups");
    }
}

export async function adminUpdateGroup(id: number, data: { name?: string; color?: string | null; description?: string | null }) {
    await requireAdmin();

    try {
        await db
            .update(groups)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(groups.id, id));
        revalidatePath("/admin/groups");
        revalidatePath("/admin");
    } catch (error) {
        console.error("Failed to update group:", error);
        throw new Error("Failed to update group");
    }
}

export async function adminDeleteGroup(id: number) {
    await requireAdmin();

    try {
        // Set todos' groupId to null instead of cascading delete
        await db
            .update(todos)
            .set({ groupId: null })
            .where(eq(todos.groupId, id));

        // Clear defaultGroupId if this was a default group
        await db
            .update(user)
            .set({ defaultGroupId: null, updatedAt: new Date() })
            .where(eq(user.defaultGroupId, id));

        // Delete the group
        await db.delete(groups).where(eq(groups.id, id));
        revalidatePath("/admin/groups");
        revalidatePath("/admin");
    } catch (error) {
        console.error("Failed to delete group:", error);
        throw new Error("Failed to delete group");
    }
}

// AI Settings Management
export async function getGlobalAIEnabled(): Promise<boolean> {
    await requireAdmin();

    try {
        const result = await db
            .select()
            .from(settings)
            .where(eq(settings.key, "ai.global_enabled"))
            .limit(1);

        if (result.length === 0) {
            // Initialize the setting to true (enabled) by default
            const session = await auth.api.getSession({
                headers: await headers(),
            });

            if (session) {
                await db.insert(settings).values({
                    key: "ai.global_enabled",
                    value: JSON.stringify(true),
                    updatedBy: session.user.id,
                });
            }
            return true;
        }

        return JSON.parse(result[0].value) === true;
    } catch (error) {
        console.error("Failed to fetch global AI setting:", error);
        return true; // Default to enabled on error
    }
}

export async function setGlobalAIEnabled(enabled: boolean) {
    await requireAdmin();

    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            throw new Error("Unauthorized");
        }

        const existing = await db
            .select()
            .from(settings)
            .where(eq(settings.key, "ai.global_enabled"))
            .limit(1);

        if (existing.length > 0) {
            await db
                .update(settings)
                .set({
                    value: JSON.stringify(enabled),
                    updatedAt: new Date(),
                    updatedBy: session.user.id,
                })
                .where(eq(settings.key, "ai.global_enabled"));
        } else {
            await db.insert(settings).values({
                key: "ai.global_enabled",
                value: JSON.stringify(enabled),
                updatedBy: session.user.id,
            });
        }

        revalidatePath("/admin");
        revalidatePath("/admin/users");
        revalidatePath("/"); // Revalidate root to update AI icon visibility
    } catch (error) {
        console.error("Failed to update global AI setting:", error);
        throw new Error("Failed to update global AI setting");
    }
}

