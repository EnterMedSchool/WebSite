-- Lessons access + compact progress (minimizes per-action writes)
-- 1) User-course entitlement for paid gating
CREATE TABLE IF NOT EXISTS user_course_entitlement (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  source VARCHAR(16) NOT NULL DEFAULT 'grant', -- purchase|grant|trial
  starts_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS uce_user_course_idx ON user_course_entitlement (user_id, course_id);
CREATE INDEX IF NOT EXISTS uce_course_user_idx ON user_course_entitlement (course_id, user_id);
CREATE INDEX IF NOT EXISTS uce_ends_idx ON user_course_entitlement (ends_at);

-- 2) Compact progress snapshot per user+course
CREATE TABLE IF NOT EXISTS user_course_progress_compact (
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  xp_total INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, course_id)
);

-- Helpful index when scanning by course
CREATE INDEX IF NOT EXISTS ucpc_course_idx ON user_course_progress_compact (course_id);

