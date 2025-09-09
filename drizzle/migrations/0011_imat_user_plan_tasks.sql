-- Tasks for IMAT per-user planner (independent of study rooms/tasks)
CREATE TABLE IF NOT EXISTS imat_user_plan_tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  task_index INTEGER NOT NULL,
  label VARCHAR(500) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  xp_awarded BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS imat_plan_tasks_user_idx ON imat_user_plan_tasks(user_id);
CREATE INDEX IF NOT EXISTS imat_plan_tasks_day_idx ON imat_user_plan_tasks(user_id, day_number);

