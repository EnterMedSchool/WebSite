-- Programs table (per-university program details)
CREATE TABLE IF NOT EXISTS "university_programs" (
  "id" serial PRIMARY KEY,
  "university_id" integer NOT NULL,
  "name" varchar(120),
  "language" varchar(24) NOT NULL,
  "admission_exam" varchar(40),
  "tuition_min" integer,
  "tuition_max" integer,
  "currency" varchar(8),
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "programs_university_idx" ON "university_programs" ("university_id");

-- Optional program-scoped yearly stats (keeps old uni-scoped tables too)
CREATE TABLE IF NOT EXISTS "program_year_stats" (
  "id" serial PRIMARY KEY,
  "program_id" integer NOT NULL,
  "year" integer NOT NULL,
  "candidate_type" varchar(24) NOT NULL,
  "min_score" double precision,
  "seats" integer,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "program_year_stats_program_idx" ON "program_year_stats" ("program_id");
CREATE INDEX IF NOT EXISTS "program_year_stats_year_idx" ON "program_year_stats" ("year");

