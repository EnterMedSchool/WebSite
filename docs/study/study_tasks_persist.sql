-- Make study task lists user-global by default so they move with the user across rooms
BEGIN;

ALTER TABLE study_task_lists
  ALTER COLUMN session_id DROP NOT NULL;

ALTER TABLE study_task_lists
  ADD COLUMN IF NOT EXISTS is_global BOOLEAN NOT NULL DEFAULT true;

-- Track last modification time for reconciliation
ALTER TABLE study_task_lists
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- For existing rows that already have a session_id, you may optionally mark them as session-scoped
-- UPDATE study_task_lists SET is_global=false WHERE session_id IS NOT NULL;

COMMIT;
