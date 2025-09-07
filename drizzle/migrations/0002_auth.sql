-- Add auth-related columns to users and basic indexes
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" varchar(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" varchar(500);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" varchar(255);

-- Helpful index for email lookups
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS users_email_idx ON "users" ("email");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

