-- Study feature schema (isolated). Safe to drop independently.
-- Run this against your Postgres database (e.g., Vercel Postgres).
-- It creates the tables used by the study rooms feature.

BEGIN;

-- 1) Study sessions (rooms)
CREATE TABLE IF NOT EXISTS study_sessions (
  id              SERIAL PRIMARY KEY,
  creator_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  slug            VARCHAR(64) NOT NULL UNIQUE,
  shared_end_at   TIMESTAMPTZ,
  total_joins     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS study_sessions_created_idx ON study_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS study_sessions_popular_idx ON study_sessions(total_joins DESC);
-- Enforce one personal room per user
CREATE UNIQUE INDEX IF NOT EXISTS study_sessions_creator_unique ON study_sessions(creator_user_id);

-- 2) Participants (who is/was in a room)
CREATE TABLE IF NOT EXISTS study_session_participants (
  id          SERIAL PRIMARY KEY,
  session_id  INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT study_participants_unique UNIQUE (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS study_participants_session_idx ON study_session_participants(session_id);
CREATE INDEX IF NOT EXISTS study_participants_user_idx ON study_session_participants(user_id);

-- 3) Messages (chat)
CREATE TABLE IF NOT EXISTS study_messages (
  id          SERIAL PRIMARY KEY,
  session_id  INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS study_messages_session_idx ON study_messages(session_id);
CREATE INDEX IF NOT EXISTS study_messages_created_idx ON study_messages(created_at);

-- 4) Task lists (per user per session)
CREATE TABLE IF NOT EXISTS study_task_lists (
  id          SERIAL PRIMARY KEY,
  session_id  INTEGER NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS study_task_lists_session_idx ON study_task_lists(session_id);
CREATE INDEX IF NOT EXISTS study_task_lists_user_idx ON study_task_lists(user_id);

-- 5) Task items
CREATE TABLE IF NOT EXISTS study_task_items (
  id            SERIAL PRIMARY KEY,
  task_list_id  INTEGER NOT NULL REFERENCES study_task_lists(id) ON DELETE CASCADE,
  name          VARCHAR(400) NOT NULL,
  is_completed  BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS study_task_items_list_idx ON study_task_items(task_list_id);

-- 6) User meta (last joined room)
CREATE TABLE IF NOT EXISTS study_user_meta (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_session_slug VARCHAR(64),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT study_user_meta_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS study_user_meta_user_idx ON study_user_meta(user_id);

COMMIT;
