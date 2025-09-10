-- Ensure uniqueness and fast lookups for planner events
BEGIN;

-- Unique day_completed per user x day (subject_type = 'imat_day')
CREATE UNIQUE INDEX IF NOT EXISTS lms_events_day_completed_uniq
  ON lms_events (user_id, subject_type, subject_id)
  WHERE action = 'day_completed';

-- Helpful indexes for frequent queries
CREATE INDEX IF NOT EXISTS lms_events_user_action_created_idx
  ON lms_events (user_id, action, created_at DESC);

COMMIT;

