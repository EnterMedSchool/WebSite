BEGIN;

-- Optional hardening: add foreign keys to users(id) with cascade.
-- Safe to run multiple times with IF NOT EXISTS checks via naming convention.

DO $$ BEGIN
  ALTER TABLE anki_tamagotchi
    ADD CONSTRAINT anki_tamagotchi_user_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE term_ratings
    ADD CONSTRAINT term_ratings_user_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE term_comments
    ADD CONSTRAINT term_comments_user_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;

