-- XP and Levels for users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "xp" integer DEFAULT 0 NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "level" integer DEFAULT 1 NOT NULL;

-- Idempotency for tracking user actions in LMS events
-- Ensure a user can have at most one event per (subject_type, subject_id, action)
CREATE UNIQUE INDEX IF NOT EXISTS lms_events_user_subject_action_unique
ON "lms_events" ("user_id", "subject_type", "subject_id", "action")
WHERE "user_id" IS NOT NULL;

