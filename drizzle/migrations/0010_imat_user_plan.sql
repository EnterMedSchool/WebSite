-- IMAT per-user planner meta table
CREATE TABLE IF NOT EXISTS imat_user_plan (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  task_list_id INTEGER,
  start_date TIMESTAMPTZ,
  current_day INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS imat_user_plan_user_idx ON imat_user_plan(user_id);

