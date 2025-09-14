-- Add session invalidation metadata to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session_version" integer NOT NULL DEFAULT 1;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_password_change_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_logout_all_at" timestamp;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS users_session_version_idx ON "users" ("session_version");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

