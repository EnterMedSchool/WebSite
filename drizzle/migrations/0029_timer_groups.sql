-- Floating timer groups (owner-controlled state) and memberships
CREATE TABLE IF NOT EXISTS timer_groups (
  id SERIAL PRIMARY KEY,
  code VARCHAR(16) NOT NULL,
  owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS timer_groups_code_unique ON timer_groups(code);
CREATE INDEX IF NOT EXISTS timer_groups_owner_idx ON timer_groups(owner_user_id);

CREATE TABLE IF NOT EXISTS timer_group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES timer_groups(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT timer_group_members_unique UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS tgm_group_idx ON timer_group_members(group_id);
CREATE INDEX IF NOT EXISTS tgm_user_idx ON timer_group_members(user_id);

