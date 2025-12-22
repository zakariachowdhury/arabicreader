import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const todos = pgTable("todos", {
    id: serial("id").primaryKey(),
    content: text("content").notNull(),
    completed: boolean("completed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
