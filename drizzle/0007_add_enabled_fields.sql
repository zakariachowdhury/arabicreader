-- Add enabled column to books, units, and lessons tables
ALTER TABLE "books" ADD COLUMN "enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "units" ADD COLUMN "enabled" boolean DEFAULT true NOT NULL;
ALTER TABLE "lessons" ADD COLUMN "enabled" boolean DEFAULT true NOT NULL;


