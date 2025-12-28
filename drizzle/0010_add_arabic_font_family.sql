-- Add arabic_font_family column to user table
ALTER TABLE "user" ADD COLUMN "arabic_font_family" text DEFAULT 'Scheherazade New' NOT NULL;

