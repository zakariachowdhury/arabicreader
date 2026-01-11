-- Add navigation_links column to chat_messages table
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "navigation_links" jsonb;


