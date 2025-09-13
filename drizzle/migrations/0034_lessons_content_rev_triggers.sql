-- Track lesson content changes with a cheap cursor and triggers
-- Bumps when lesson/body/video/meta changes, when questions/choices change,
-- when chapter mapping changes, or when a chapter's title/slug changes.

BEGIN;

-- 1) Add change cursor columns on lessons
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS content_rev BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS content_changed_at TIMESTAMP NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS lessons_content_changed_at_idx ON lessons (content_changed_at DESC);
CREATE INDEX IF NOT EXISTS lessons_content_rev_idx ON lessons (content_rev DESC);

-- 2) Helper: bump a lesson's cursor
CREATE OR REPLACE FUNCTION ems_bump_lesson_content(lid INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE lessons
     SET content_rev = COALESCE(content_rev,0) + 1,
         content_changed_at = NOW()
   WHERE id = lid;
END;
$$;

-- 3) Lessons self-bump on relevant direct updates
CREATE OR REPLACE FUNCTION ems_lessons_bump_self()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.content_rev := COALESCE(OLD.content_rev,0) + 1;
  NEW.content_changed_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lessons_content_bump ON lessons;
CREATE TRIGGER trg_lessons_content_bump
BEFORE UPDATE OF title, body, video_html, course_id, duration_min, length_min, meta, visibility
ON lessons
FOR EACH ROW
WHEN (
  NEW.title IS DISTINCT FROM OLD.title OR
  NEW.body IS DISTINCT FROM OLD.body OR
  NEW.video_html IS DISTINCT FROM OLD.video_html OR
  NEW.course_id IS DISTINCT FROM OLD.course_id OR
  NEW.duration_min IS DISTINCT FROM OLD.duration_min OR
  NEW.length_min IS DISTINCT FROM OLD.length_min OR
  NEW.meta IS DISTINCT FROM OLD.meta OR
  NEW.visibility IS DISTINCT FROM OLD.visibility
)
EXECUTE FUNCTION ems_lessons_bump_self();

-- 4) Questions -> bump parent lesson
CREATE OR REPLACE FUNCTION ems_bump_from_question()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  lid INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    lid := OLD.lesson_id;
  ELSE
    lid := NEW.lesson_id;
  END IF;
  IF lid IS NOT NULL THEN
    PERFORM ems_bump_lesson_content(lid);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_questions_bump ON questions;
CREATE TRIGGER trg_questions_bump
AFTER INSERT OR UPDATE OR DELETE ON questions
FOR EACH ROW EXECUTE FUNCTION ems_bump_from_question();

-- 5) Choices -> bump lesson via question
CREATE OR REPLACE FUNCTION ems_bump_from_choice()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  qid INTEGER;
  lid INTEGER;
BEGIN
  qid := COALESCE(NEW.question_id, OLD.question_id);
  IF qid IS NOT NULL THEN
    SELECT lesson_id INTO lid FROM questions WHERE id = qid;
    IF lid IS NOT NULL THEN PERFORM ems_bump_lesson_content(lid); END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_choices_bump ON choices;
CREATE TRIGGER trg_choices_bump
AFTER INSERT OR UPDATE OR DELETE ON choices
FOR EACH ROW EXECUTE FUNCTION ems_bump_from_choice();

-- 6) Chapter mapping -> bump lesson
CREATE OR REPLACE FUNCTION ems_bump_from_chapter_lessons()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM ems_bump_lesson_content(OLD.lesson_id);
  ELSE
    PERFORM ems_bump_lesson_content(NEW.lesson_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_chapter_lessons_bump ON chapter_lessons;
CREATE TRIGGER trg_chapter_lessons_bump
AFTER INSERT OR UPDATE OR DELETE ON chapter_lessons
FOR EACH ROW EXECUTE FUNCTION ems_bump_from_chapter_lessons();

-- 7) Chapter title/slug -> bump all lessons in that chapter
CREATE OR REPLACE FUNCTION ems_bump_lessons_in_chapter()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    UPDATE lessons
       SET content_rev = COALESCE(content_rev,0) + 1,
           content_changed_at = NOW()
     WHERE id IN (
       SELECT lesson_id FROM chapter_lessons WHERE chapter_id = NEW.id
     );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chapters_bump_lessons ON chapters;
CREATE TRIGGER trg_chapters_bump_lessons
AFTER UPDATE OF title, slug ON chapters
FOR EACH ROW
WHEN (
  NEW.title IS DISTINCT FROM OLD.title OR
  NEW.slug IS DISTINCT FROM OLD.slug
)
EXECUTE FUNCTION ems_bump_lessons_in_chapter();

-- 8) Helper view for free lessons change feed
CREATE OR REPLACE VIEW free_lessons_changed_v AS
SELECT l.id, l.slug, l.content_rev, l.content_changed_at, l.course_id
FROM lessons l
JOIN courses c ON c.id = l.course_id
WHERE (c.meta->>'access') IS DISTINCT FROM 'paid'
  AND (c.visibility IS NULL OR c.visibility='public');

COMMIT;

