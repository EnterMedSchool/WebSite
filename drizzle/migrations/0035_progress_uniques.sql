-- Ensure efficient upserts for per-user progress
-- Adds unique indexes so ON CONFLICT (user_id, lesson_id|question_id) works reliably

BEGIN;

-- 1) Detailed lesson progress: one row per user x lesson
-- Some environments only had simple indexes; add a unique composite index
CREATE UNIQUE INDEX IF NOT EXISTS user_lesson_progress_user_lesson_uidx
  ON user_lesson_progress (user_id, lesson_id);

-- Helpful covering index for lookups by (lesson_id, user_id) if needed
CREATE INDEX IF NOT EXISTS user_lesson_progress_lesson_user_idx
  ON user_lesson_progress (lesson_id, user_id);

-- 2) Detailed question progress: one row per user x question
CREATE UNIQUE INDEX IF NOT EXISTS user_question_progress_user_question_uidx
  ON user_question_progress (user_id, question_id);

-- Helpful covering index for lookups by (question_id, user_id)
CREATE INDEX IF NOT EXISTS user_question_progress_question_user_idx
  ON user_question_progress (question_id, user_id);

COMMIT;

