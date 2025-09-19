-- Allow multiple completed case attempts while keeping a single active attempt per case.
DROP INDEX IF EXISTS case_attempts_user_active_idx;

CREATE UNIQUE INDEX IF NOT EXISTS case_attempts_user_active_idx
  ON case_attempts (user_id, case_id)
  WHERE status = 'in_progress';

CREATE INDEX IF NOT EXISTS case_attempts_user_status_idx
  ON case_attempts (user_id, status, completed_at DESC);

CREATE INDEX IF NOT EXISTS case_attempts_case_status_idx
  ON case_attempts (case_id, status, completed_at DESC);