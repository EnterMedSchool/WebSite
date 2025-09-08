-- Add optional thumbnail URL for mini-lesson slider on homepage
ALTER TABLE IF EXISTS "lessons"
  ADD COLUMN IF NOT EXISTS "mini_lesson_thumbnail" varchar(500);

