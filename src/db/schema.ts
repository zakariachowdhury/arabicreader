import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    isAdmin: boolean("is_admin").default(false).notNull(),
    aiEnabled: boolean("ai_enabled").default(true).notNull(),
    defaultGroupId: integer("default_group_id"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
});

export const groups = pgTable("groups", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    color: text("color"),
    description: text("description"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const todos = pgTable("todos", {
    id: serial("id").primaryKey(),
    content: text("content").notNull(),
    completed: boolean("completed").default(false).notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    groupId: integer("group_id")
        .references(() => groups.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
    id: serial("id").primaryKey(),
    key: text("key").notNull().unique(), // Unique key for each setting (e.g., "openrouter.api_key", "openrouter.supported_models")
    value: text("value").notNull(), // JSON string value
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    updatedBy: text("updated_by")
        .references(() => user.id),
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type Setting = typeof settings.$inferSelect;
