-- Per-user per-day rollups to avoid GROUP BY at read time
BEGIN;

CREATE TABLE IF NOT EXISTS imat_user_day_rollups (
  user_id INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  done INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, day_number)
);

-- Helper to apply deltas
CREATE OR REPLACE FUNCTION imat_rollup_apply(p_user INTEGER, p_day INTEGER, d_total INTEGER, d_done INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO imat_user_day_rollups (user_id, day_number, total, done, updated_at)
  VALUES (p_user, p_day, d_total, d_done, NOW())
  ON CONFLICT (user_id, day_number) DO UPDATE SET
    total = GREATEST(0, imat_user_day_rollups.total + EXCLUDED.total),
    done  = GREATEST(0, imat_user_day_rollups.done  + EXCLUDED.done),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep rollups in sync
CREATE OR REPLACE FUNCTION imat_user_plan_tasks_rollup_trg()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM imat_rollup_apply(NEW.user_id, NEW.day_number, 1, CASE WHEN NEW.is_completed THEN 1 ELSE 0 END);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM imat_rollup_apply(OLD.user_id, OLD.day_number, -1, CASE WHEN OLD.is_completed THEN -1 ELSE 0 END);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.day_number IS DISTINCT FROM OLD.day_number THEN
      PERFORM imat_rollup_apply(OLD.user_id, OLD.day_number, -1, CASE WHEN OLD.is_completed THEN -1 ELSE 0 END);
      PERFORM imat_rollup_apply(NEW.user_id, NEW.day_number, 1, CASE WHEN NEW.is_completed THEN 1 ELSE 0 END);
    ELSIF NEW.is_completed IS DISTINCT FROM OLD.is_completed THEN
      PERFORM imat_rollup_apply(NEW.user_id, NEW.day_number, 0, CASE WHEN NEW.is_completed THEN 1 ELSE -1 END);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS imat_user_plan_tasks_rollup_aiud ON imat_user_plan_tasks;
CREATE TRIGGER imat_user_plan_tasks_rollup_aiud
AFTER INSERT OR UPDATE OR DELETE ON imat_user_plan_tasks
FOR EACH ROW EXECUTE FUNCTION imat_user_plan_tasks_rollup_trg();

-- Backfill rollups from existing tasks
INSERT INTO imat_user_day_rollups (user_id, day_number, total, done)
SELECT user_id, day_number, COUNT(*), SUM(CASE WHEN is_completed THEN 1 ELSE 0 END)
FROM imat_user_plan_tasks
GROUP BY user_id, day_number
ON CONFLICT (user_id, day_number) DO UPDATE SET
  total = EXCLUDED.total,
  done  = EXCLUDED.done,
  updated_at = NOW();

COMMIT;

