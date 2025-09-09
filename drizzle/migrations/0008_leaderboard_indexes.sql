-- Leaderboard performance indexes
-- Speed up weekly aggregates and keyset lookups

-- lms_events: filter by action and recent created_at, group by user
CREATE INDEX IF NOT EXISTS lms_events_action_created_idx
  ON lms_events (action, created_at DESC);

CREATE INDEX IF NOT EXISTS lms_events_user_action_created_idx
  ON lms_events (user_id, action, created_at DESC);

-- users: keyset ordering by (xp DESC, id ASC)
CREATE INDEX IF NOT EXISTS users_xp_idx
  ON users (xp DESC, id ASC);

