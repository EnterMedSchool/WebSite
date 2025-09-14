-- Verification and password reset tokens

CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "id" serial PRIMARY KEY,
  "user_id" integer,
  "email" varchar(255),
  "purpose" varchar(32) NOT NULL,
  "token_hash" varchar(64) NOT NULL,
  "expires_at" timestamp NOT NULL,
  "consumed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "ip" varchar(64),
  "user_agent" varchar(255)
);

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS verification_tokens_token_uniq
  ON "verification_tokens" ("token_hash");
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS verification_tokens_email_purpose_idx
  ON "verification_tokens" ("email", "purpose")
  WHERE consumed_at IS NULL;
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS verification_tokens_user_purpose_idx
  ON "verification_tokens" ("user_id", "purpose")
  WHERE consumed_at IS NULL;
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

