-- Add explicit lesson length in minutes
ALTER TABLE IF EXISTS "lessons"
  ADD COLUMN IF NOT EXISTS "length_min" integer;

