-- University extras: admissions timeline, costs, and flags

BEGIN;

ALTER TABLE "universities"
  ADD COLUMN IF NOT EXISTS "has_dorms" boolean,
  ADD COLUMN IF NOT EXISTS "has_scholarships" boolean;

CREATE TABLE IF NOT EXISTS "university_costs" (
  "id" serial PRIMARY KEY,
  "university_id" integer NOT NULL,
  "rent_eur" integer,
  "food_index" integer,
  "transport_eur" integer,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "uni_costs_uni_idx" ON "university_costs" ("university_id");

CREATE TABLE IF NOT EXISTS "university_admissions" (
  "id" serial PRIMARY KEY,
  "university_id" integer NOT NULL,
  "year" integer NOT NULL,
  "opens_month" smallint,
  "deadline_month" smallint,
  "results_month" smallint,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("university_id", "year")
);

CREATE INDEX IF NOT EXISTS "uni_adm_uni_idx" ON "university_admissions" ("university_id");
CREATE INDEX IF NOT EXISTS "uni_adm_year_idx" ON "university_admissions" ("year");

COMMIT;

