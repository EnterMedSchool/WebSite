-- Performance improvements for planner at scale
BEGIN;

-- 1) Add updated_at for per-row cache invalidation and ETag computation
ALTER TABLE imat_user_plan_tasks
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2) Composite index to speed per-user ordered scans by day/task order
CREATE INDEX IF NOT EXISTS imat_plan_tasks_user_day_order_idx
  ON imat_user_plan_tasks (user_id, day_number, task_index, id);

-- 3) Aggregate-friendly index for quick day summaries
CREATE INDEX IF NOT EXISTS imat_plan_tasks_user_day_idx
  ON imat_user_plan_tasks (user_id, day_number);

COMMIT;

