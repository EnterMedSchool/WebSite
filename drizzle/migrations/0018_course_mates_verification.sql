-- Verification flow for Course Mates
-- Adds per-user verification flag and a table to stage education requests

BEGIN;

ALTER TABLE IF EXISTS "users"
  ADD COLUMN IF NOT EXISTS "mates_verified" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "user_education_requests" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "university_id" integer,
  "school_id" integer,
  "medical_course_id" integer,
  "study_year" smallint,
  "status" varchar(16) NOT NULL DEFAULT 'pending', -- pending | approved | rejected | superseded
  "note" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "reviewed_at" timestamp,
  "reviewed_by" integer
);

CREATE INDEX IF NOT EXISTS "uer_user_idx" ON "user_education_requests" ("user_id");
CREATE INDEX IF NOT EXISTS "uer_status_idx" ON "user_education_requests" ("status");
CREATE INDEX IF NOT EXISTS "uer_user_created_idx" ON "user_education_requests" ("user_id", "created_at" DESC);

COMMIT;

