-- Per-user selection of relevant courses to surface on the dashboard
BEGIN;

CREATE TABLE IF NOT EXISTS "user_relevant_courses" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "course_id" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("user_id", "course_id")
);
CREATE INDEX IF NOT EXISTS "urc_user_idx" ON "user_relevant_courses" ("user_id");
CREATE INDEX IF NOT EXISTS "urc_course_idx" ON "user_relevant_courses" ("course_id");

COMMIT;

