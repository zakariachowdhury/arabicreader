-- Add arabic_font_size_multiplier column to user table
ALTER TABLE "user" ADD COLUMN "arabic_font_size_multiplier" real DEFAULT 1.5 NOT NULL;


