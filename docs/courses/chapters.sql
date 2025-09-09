-- Chapters + Chapter Lessons (course content hierarchy)
-- Run against your Postgres database.

BEGIN;

CREATE TABLE IF NOT EXISTS chapters (
  id           SERIAL PRIMARY KEY,
  course_id    INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  slug         VARCHAR(120) NOT NULL UNIQUE,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  position     INTEGER NOT NULL DEFAULT 0,
  visibility   VARCHAR(16) DEFAULT 'public',
  meta         JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chapters_course_idx ON chapters(course_id);
CREATE INDEX IF NOT EXISTS chapters_slug_idx   ON chapters(slug);

CREATE TABLE IF NOT EXISTS chapter_lessons (
  id          SERIAL PRIMARY KEY,
  chapter_id  INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  lesson_id   INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chapter_lessons_unique UNIQUE (chapter_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS chapter_lessons_chapter_idx ON chapter_lessons(chapter_id);
CREATE INDEX IF NOT EXISTS chapter_lessons_lesson_idx  ON chapter_lessons(lesson_id);
CREATE INDEX IF NOT EXISTS chapter_lessons_order_idx   ON chapter_lessons(chapter_id, position);

COMMIT;

