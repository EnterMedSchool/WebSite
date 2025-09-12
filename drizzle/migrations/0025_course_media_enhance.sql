BEGIN;
ALTER TABLE IF EXISTS "course_event_photos"
  ADD COLUMN IF NOT EXISTS "thumb_url" varchar(800);

ALTER TABLE IF EXISTS "course_events"
  ADD COLUMN IF NOT EXISTS "thumb_url" varchar(800);
COMMIT;

