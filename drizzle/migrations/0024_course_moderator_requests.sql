-- Course moderator application requests
BEGIN;

CREATE TABLE IF NOT EXISTS "course_moderator_requests" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "course_id" integer NOT NULL,
  "note" text,
  "status" varchar(16) NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  "created_at" timestamp NOT NULL DEFAULT now(),
  "reviewed_at" timestamp,
  "reviewed_by" integer
);

CREATE INDEX IF NOT EXISTS "cmr_user_idx" ON "course_moderator_requests" ("user_id");
CREATE INDEX IF NOT EXISTS "cmr_course_idx" ON "course_moderator_requests" ("course_id");
CREATE INDEX IF NOT EXISTS "cmr_status_idx" ON "course_moderator_requests" ("status");

COMMIT;

