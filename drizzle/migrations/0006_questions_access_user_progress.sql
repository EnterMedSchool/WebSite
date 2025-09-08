-- Add access control to questions
ALTER TABLE IF EXISTS "questions"
  ADD COLUMN IF NOT EXISTS "access" varchar(12) DEFAULT 'public'; -- public | auth | guest | premium

-- Track user-wide total correct answers and premium flag
ALTER TABLE IF EXISTS "users"
  ADD COLUMN IF NOT EXISTS "total_correct_answers" integer DEFAULT 0 NOT NULL;
ALTER TABLE IF EXISTS "users"
  ADD COLUMN IF NOT EXISTS "is_premium" boolean DEFAULT false NOT NULL;

-- Per-user per-question progress (one row per user x question)
CREATE TABLE IF NOT EXISTS "user_question_progress" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "question_id" integer NOT NULL,
  "choice_id" integer,
  "correct" boolean NOT NULL DEFAULT false,
  "answered_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "uqp_user_idx" ON "user_question_progress" ("user_id");
CREATE INDEX IF NOT EXISTS "uqp_question_idx" ON "user_question_progress" ("question_id");
-- Ensure only one row per (user, question)
CREATE UNIQUE INDEX IF NOT EXISTS "uqp_user_question_unique" ON "user_question_progress" ("user_id", "question_id");

