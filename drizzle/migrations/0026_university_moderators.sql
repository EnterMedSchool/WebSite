-- University representatives: moderators and application requests
BEGIN;

CREATE TABLE IF NOT EXISTS "university_moderators" (
  "id" serial PRIMARY KEY,
  "university_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "role" varchar(24) NOT NULL DEFAULT 'moderator',
  "created_at" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("university_id", "user_id")
);
CREATE INDEX IF NOT EXISTS "umod_uni_idx" ON "university_moderators" ("university_id");

CREATE TABLE IF NOT EXISTS "university_moderator_requests" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "university_id" integer NOT NULL,
  "note" text,
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "reviewed_at" timestamp,
  "reviewed_by" integer
);
CREATE INDEX IF NOT EXISTS "umod_req_user_idx" ON "university_moderator_requests" ("user_id");
CREATE INDEX IF NOT EXISTS "umod_req_uni_idx" ON "university_moderator_requests" ("university_id");
CREATE INDEX IF NOT EXISTS "umod_req_status_idx" ON "university_moderator_requests" ("status");

COMMIT;

