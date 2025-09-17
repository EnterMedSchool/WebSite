CREATE TABLE IF NOT EXISTS lesson_bundles (
    lesson_id INTEGER PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    bundle JSONB NOT NULL,
    content_rev INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lesson_bundles_course_idx ON lesson_bundles(course_id);
CREATE INDEX IF NOT EXISTS lesson_bundles_updated_idx ON lesson_bundles(updated_at);
