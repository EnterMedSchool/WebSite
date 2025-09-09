-- Add a `length_min` integer to lessons for per-lesson duration in minutes
-- Safe to run multiple times

ALTER TABLE IF EXISTS lessons
  ADD COLUMN IF NOT EXISTS length_min INTEGER;

-- Optional: backfill from existing duration_min if present
UPDATE lessons SET length_min = duration_min WHERE length_min IS NULL AND duration_min IS NOT NULL;

