-- IMAT planner templates and linkage for deduplication
BEGIN;

CREATE TABLE IF NOT EXISTS imat_task_templates (
  id SERIAL PRIMARY KEY,
  day_number INTEGER NOT NULL,
  task_index INTEGER NOT NULL,
  label TEXT NOT NULL,
  UNIQUE(day_number, task_index)
);

CREATE INDEX IF NOT EXISTS imat_templates_day_idx ON imat_task_templates(day_number, task_index);

ALTER TABLE imat_user_plan_tasks
  ADD COLUMN IF NOT EXISTS template_id INTEGER REFERENCES imat_task_templates(id);

-- Allow label to be nullable for future dedup (kept populated for backward compatibility)
DO $$ BEGIN
  ALTER TABLE imat_user_plan_tasks ALTER COLUMN label DROP NOT NULL;
EXCEPTION WHEN others THEN NULL; END $$;

COMMIT;

