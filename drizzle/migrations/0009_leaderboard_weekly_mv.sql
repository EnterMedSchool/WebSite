-- Materialized view for weekly XP leaderboard
-- Summarizes the last 7 days of xp_awarded per user.

CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_weekly_xp AS
SELECT
  user_id,
  COALESCE(SUM((payload->>'amount')::int), 0) AS weekly_xp
FROM lms_events
WHERE action = 'xp_awarded'
  AND created_at >= now() - interval '7 days'
GROUP BY user_id;

-- Unique index is required to use CONCURRENTLY on refresh
CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_weekly_user_idx
  ON leaderboard_weekly_xp (user_id);

-- Sorting index for fast ordering and keyset pagination
CREATE INDEX IF NOT EXISTS leaderboard_weekly_order_idx
  ON leaderboard_weekly_xp (weekly_xp DESC, user_id ASC);

