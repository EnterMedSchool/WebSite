-- Extend study tasks for hierarchy, ordering, and XP tracking
BEGIN;

ALTER TABLE study_task_items
  ADD COLUMN IF NOT EXISTS parent_item_id INTEGER REFERENCES study_task_items(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS xp_awarded BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS study_task_items_parent_idx ON study_task_items(parent_item_id);
CREATE INDEX IF NOT EXISTS study_task_items_order_idx ON study_task_items(task_list_id, position);

COMMIT;

