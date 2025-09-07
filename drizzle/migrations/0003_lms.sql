-- LMS schema extensions

-- Courses: ordering + visibility
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "rank_key" varchar(32);
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "visibility" varchar(16) DEFAULT 'public'::varchar;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "meta" jsonb;

-- Sections within a course
CREATE TABLE IF NOT EXISTS "course_sections" (
  "id" serial PRIMARY KEY,
  "course_id" integer NOT NULL,
  "slug" varchar(120) NOT NULL,
  "title" varchar(200) NOT NULL,
  "rank_key" varchar(32),
  CONSTRAINT course_sections_unique UNIQUE (course_id, slug)
);
CREATE INDEX IF NOT EXISTS course_sections_course_idx ON "course_sections" ("course_id");

-- Lessons: ordering + visibility + optional section
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "rank_key" varchar(32);
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "visibility" varchar(16) DEFAULT 'public'::varchar;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "section_id" integer;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "duration_min" integer;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "meta" jsonb;

-- Lesson prerequisites
CREATE TABLE IF NOT EXISTS "lesson_prerequisites" (
  "lesson_id" integer NOT NULL,
  "requires_lesson_id" integer NOT NULL,
  CONSTRAINT lesson_prereq_unique UNIQUE (lesson_id, requires_lesson_id)
);
CREATE INDEX IF NOT EXISTS lesson_prereq_lesson_idx ON "lesson_prerequisites" ("lesson_id");

-- Lesson content blocks
CREATE TABLE IF NOT EXISTS "lesson_blocks" (
  "id" serial PRIMARY KEY,
  "lesson_id" integer NOT NULL,
  "kind" varchar(20) NOT NULL,
  "content" text,
  "rank_key" varchar(32)
);
CREATE INDEX IF NOT EXISTS lesson_blocks_lesson_idx ON "lesson_blocks" ("lesson_id");

-- Questions: ordering & meta
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "rank_key" varchar(32);
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "difficulty" varchar(10);
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "tags" text[];
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "version" integer DEFAULT 1;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "meta" jsonb;

-- Progress tables
CREATE TABLE IF NOT EXISTS "user_lesson_progress" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "lesson_id" integer NOT NULL,
  "progress" integer DEFAULT 0,
  "completed" boolean DEFAULT false,
  "last_viewed_at" timestamp DEFAULT now(),
  "time_spent_sec" integer DEFAULT 0,
  CONSTRAINT user_lesson_progress_unique UNIQUE (user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS ulp_user_idx ON "user_lesson_progress" ("user_id");
CREATE INDEX IF NOT EXISTS ulp_lesson_idx ON "user_lesson_progress" ("lesson_id");

CREATE TABLE IF NOT EXISTS "user_course_progress" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "course_id" integer NOT NULL,
  "progress" integer DEFAULT 0,
  "completed" boolean DEFAULT false,
  CONSTRAINT user_course_progress_unique UNIQUE (user_id, course_id)
);

-- Simple event outbox
CREATE TABLE IF NOT EXISTS "lms_events" (
  "id" serial PRIMARY KEY,
  "user_id" integer,
  "subject_type" varchar(20) NOT NULL,
  "subject_id" integer NOT NULL,
  "action" varchar(20) NOT NULL,
  "payload" jsonb,
  "created_at" timestamp DEFAULT now(),
  "processed_at" timestamp
);

