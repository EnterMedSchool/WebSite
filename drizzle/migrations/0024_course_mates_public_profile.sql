-- Adds a privacy flag for Course Mates public visibility
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "mates_public" boolean NOT NULL DEFAULT false;

