-- Course Mates: universities -> schools -> medical courses, and student orgs
-- Safe, idempotent migration for Postgres

BEGIN;

-- Faculties/Schools within a university (e.g., School of Medicine)
CREATE TABLE IF NOT EXISTS "schools" (
  "id" serial PRIMARY KEY,
  "university_id" integer NOT NULL,
  "slug" varchar(120) NOT NULL UNIQUE,
  "name" varchar(200) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "schools_university_idx" ON "schools" ("university_id");

-- Medical school courses (programs) within a school/university
CREATE TABLE IF NOT EXISTS "medical_school_courses" (
  "id" serial PRIMARY KEY,
  "university_id" integer NOT NULL,
  "school_id" integer,
  "slug" varchar(160) NOT NULL UNIQUE,
  "name" varchar(200) NOT NULL,
  "degree_type" varchar(32),          -- MD, MBBS, etc.
  "language" varchar(24),             -- English, Italian, etc.
  "duration_years" smallint,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "msc_university_idx" ON "medical_school_courses" ("university_id");
CREATE INDEX IF NOT EXISTS "msc_school_idx" ON "medical_school_courses" ("school_id");

-- Student organizations (belong to a university, can link to multiple schools/courses)
CREATE TABLE IF NOT EXISTS "student_organizations" (
  "id" serial PRIMARY KEY,
  "university_id" integer NOT NULL,
  "slug" varchar(160) NOT NULL UNIQUE,
  "name" varchar(200) NOT NULL,
  "description" text,
  "website" varchar(300),
  "contact_email" varchar(200),
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "orgs_university_idx" ON "student_organizations" ("university_id");

-- Junction: orgs x schools (many-to-many)
CREATE TABLE IF NOT EXISTS "student_organization_schools" (
  "organization_id" integer NOT NULL,
  "school_id" integer NOT NULL,
  PRIMARY KEY ("organization_id", "school_id")
);
CREATE INDEX IF NOT EXISTS "org_schools_school_idx" ON "student_organization_schools" ("school_id");

-- Optional junction: orgs x courses (many-to-many)
CREATE TABLE IF NOT EXISTS "student_organization_courses" (
  "organization_id" integer NOT NULL,
  "course_id" integer NOT NULL,
  PRIMARY KEY ("organization_id", "course_id")
);
CREATE INDEX IF NOT EXISTS "org_courses_course_idx" ON "student_organization_courses" ("course_id");

-- Users: link to university/school/course and store study year
ALTER TABLE IF EXISTS "users"
  ADD COLUMN IF NOT EXISTS "university_id" integer,
  ADD COLUMN IF NOT EXISTS "school_id" integer,
  ADD COLUMN IF NOT EXISTS "medical_course_id" integer,
  ADD COLUMN IF NOT EXISTS "study_year" smallint;

CREATE INDEX IF NOT EXISTS "users_university_idx" ON "users" ("university_id");
CREATE INDEX IF NOT EXISTS "users_school_idx" ON "users" ("school_id");
CREATE INDEX IF NOT EXISTS "users_medical_course_idx" ON "users" ("medical_course_id");
CREATE INDEX IF NOT EXISTS "users_study_year_idx" ON "users" ("study_year");
CREATE INDEX IF NOT EXISTS "users_course_year_idx" ON "users" ("medical_course_id", "study_year");
CREATE INDEX IF NOT EXISTS "users_school_year_idx" ON "users" ("school_id", "study_year");

COMMIT;

