"use strict";
"use server";

import { db } from "@/db";
import { todos } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTodos() {
    try {
        return await db.select().from(todos).orderBy(asc(todos.id));
    } catch (error) {
        console.error("Failed to fetch todos:", error);
        return [];
    }
}

export async function addTodo(formData: FormData) {
    const content = formData.get("content") as string;
    if (!content || content.trim() === "") return;

    try {
        await db.insert(todos).values({ content });
        revalidatePath("/");
    } catch (error) {
        console.error("Failed to add todo:", error);
    }
}

export async function toggleTodo(id: number, completed: boolean) {
    try {
        await db.update(todos).set({ completed }).where(eq(todos.id, id));
        revalidatePath("/");
    } catch (error) {
        console.error("Failed to toggle todo:", error);
    }
}

export async function deleteTodo(id: number) {
    try {
        await db.delete(todos).where(eq(todos.id, id));
        revalidatePath("/");
    } catch (error) {
        console.error("Failed to delete todo:", error);
    }
}
