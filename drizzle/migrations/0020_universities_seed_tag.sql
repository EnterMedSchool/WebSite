-- Add a seed tag to universities for easier cleanup of bulk fake content

BEGIN;

ALTER TABLE "universities"
  ADD COLUMN IF NOT EXISTS "seed_tag" varchar(64);

COMMIT;

