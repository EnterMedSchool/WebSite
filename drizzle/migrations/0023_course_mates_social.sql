-- Course Mates social features: moderators, settings, feed posts, events, photos
-- Safe/idempotent Postgres migration

BEGIN;

-- Moderators per medical course (scoped to course for now)
CREATE TABLE IF NOT EXISTS "course_mates_moderators" (
  "id" serial PRIMARY KEY,
  "course_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "role" varchar(24) NOT NULL DEFAULT 'moderator',
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cmm_course_idx" ON "course_mates_moderators" ("course_id");
CREATE UNIQUE INDEX IF NOT EXISTS "cmm_course_user_unique" ON "course_mates_moderators" ("course_id", "user_id");

-- Course settings (e.g., study vibe)
CREATE TABLE IF NOT EXISTS "course_mates_settings" (
  "course_id" integer PRIMARY KEY,
  "study_vibe" varchar(80)
);

-- Course feed posts
CREATE TABLE IF NOT EXISTS "course_feed_posts" (
  "id" serial PRIMARY KEY,
  "course_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp
);
CREATE INDEX IF NOT EXISTS "cfp_course_created_idx" ON "course_feed_posts" ("course_id", "created_at" DESC);

-- Course events
CREATE TABLE IF NOT EXISTS "course_events" (
  "id" serial PRIMARY KEY,
  "course_id" integer NOT NULL,
  "title" varchar(200) NOT NULL,
  "start_at" timestamp NOT NULL,
  "end_at" timestamp,
  "location" varchar(200),
  "description" text,
  "created_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "ce_course_start_idx" ON "course_events" ("course_id", "start_at" DESC);

-- Event photos (links only)
CREATE TABLE IF NOT EXISTS "course_event_photos" (
  "id" serial PRIMARY KEY,
  "event_id" integer NOT NULL,
  "url" varchar(800) NOT NULL,
  "caption" varchar(200),
  "added_by" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cep_event_idx" ON "course_event_photos" ("event_id");

COMMIT;

