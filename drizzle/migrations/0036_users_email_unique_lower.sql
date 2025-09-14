-- Enforce uniqueness on emails case-insensitively (ignoring NULLs)
-- If your dataset contains duplicates, this migration will fail.
-- Clean duplicates before applying in production.

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uniq
  ON "users" ((lower(email)))
  WHERE email IS NOT NULL;
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

