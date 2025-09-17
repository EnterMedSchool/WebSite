
import { sql } from "@/lib/db";
import { extractIframeSrc, detectProviderFromSrc } from "@/lib/video/embed";

export type LessonBundleRecord = {
  lesson: {
    id: number;
    slug: string;
    title: string;
    courseId: number;
    contentRev: number;
    contentChangedAt: string | null;
  };
  course: { id: number; slug: string; title: string } | null;
  chapter: { id: number; slug: string; title: string; position: number } | null;
  lessons: Array<{ id: number; slug: string; title: string; position: number }>;
  questionsByLesson: Record<string, any[]>;
  summary: {
    byLesson: Record<string, { total: number; correct: number; incorrect: number; attempted: number }>;
    lessonsCompleted: number[];
  };
  player: { provider: string | null; iframeSrc: string | null; source: "bundle" } | null;
  html: string;
  authors?: { author?: string | null; reviewer?: string | null };
  scope: "chapter" | "lesson";
};

export type LessonBundleRow = {
  lessonId: number;
  slug: string;
  courseId: number;
  contentRev: number;
  updatedAt: string;
  bundle: LessonBundleRecord;
};

function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseBundle(raw: unknown): LessonBundleRecord {
  const bundle = typeof raw === "string" ? (JSON.parse(raw) as LessonBundleRecord) : (raw as LessonBundleRecord);
  if (!bundle) {
    throw new Error("Invalid lesson bundle payload");
  }
  if (!bundle.scope) {
    bundle.scope = "chapter";
  }
  return bundle;
}

export async function buildLessonBundle(slug: string): Promise<LessonBundleRow | null> {
  const lessonRes = await sql<{
    id: number;
    slug: string;
    title: string;
    course_id: number;
    body: string | null;
    video_html: string | null;
    meta: any;
    content_rev: number | null;
    content_changed_at: string | null;
    position: number | null;
  }>`
    SELECT l.id,
           l.slug,
          l.title,
           l.course_id,
           l.body,
           l.video_html,
           l.meta,
           l.content_rev,
           l.content_changed_at,
           l.position
      FROM lessons l
     WHERE l.slug = ${slug}
     LIMIT 1
  `;
  const lesson = lessonRes.rows[0];
  if (!lesson) return null;

  const courseRes = await sql<{ id: number; slug: string; title: string; visibility: string | null; meta: any }>`
    SELECT c.id, c.slug, c.title, c.visibility, c.meta
      FROM courses c
     WHERE c.id = ${lesson.course_id}
     LIMIT 1
  `;
  const course = courseRes.rows[0]
    ? { id: Number(courseRes.rows[0].id), slug: String(courseRes.rows[0].slug), title: String(courseRes.rows[0].title) }
    : null;

  const chapterRes = await sql<{ id: number; slug: string; title: string; position: number; chapter_id: number }>`
    SELECT c.id, c.slug, c.title, c.position, cl.chapter_id
      FROM chapter_lessons cl
      JOIN chapters c ON c.id = cl.chapter_id
     WHERE cl.lesson_id = ${lesson.id}
  ORDER BY cl.position ASC, cl.chapter_id ASC
     LIMIT 1
  `;

  let chapter: LessonBundleRecord["chapter"] = null;
  let chapterLessons: Array<{ id: number; slug: string; title: string; position: number }> = [];
  let lessonIds: number[] = [lesson.id];

  if (chapterRes.rows[0]) {
    const row = chapterRes.rows[0];
    chapter = {
      id: Number(row.id),
      slug: String(row.slug),
      title: String(row.title),
      position: Number(row.position || 0),
    };
    const lessonsRes = await sql<{ id: number; slug: string; title: string; position: number }>`
      SELECT l.id, l.slug, l.title, cl.position
        FROM chapter_lessons cl
        JOIN lessons l ON l.id = cl.lesson_id
       WHERE cl.chapter_id = ${row.chapter_id}
    ORDER BY cl.position ASC, l.id ASC
    `;
    chapterLessons = lessonsRes.rows.map((r) => ({
      id: Number(r.id),
      slug: String(r.slug),
      title: String(r.title),
      position: Number(r.position || 0),
    }));
    lessonIds = lessonsRes.rows.map((r) => Number(r.id));
  }

  const lessonsList = chapterLessons.length
    ? chapterLessons
    : [
        {
          id: Number(lesson.id),
          slug: String(lesson.slug),
          title: String(lesson.title),
          position: Number(lesson.position ?? 0),
        },
      ];

  const questionsByLesson: Record<string, any[]> = {};
  if (lessonIds.length) {
    const questionsRes = await sql<{ qid: number; lesson_id: number; prompt: string; explanation: string | null; access: string | null; choices: any }>`
      SELECT q.id AS qid,
             q.lesson_id,
             q.prompt,
             q.explanation,
             q.access,
             COALESCE(json_agg(json_build_object('id', c.id, 'text', c.content, 'correct', c.correct) ORDER BY c.id)
                      FILTER (WHERE c.id IS NOT NULL), '[]'::json) AS choices
        FROM questions q
        LEFT JOIN choices c ON c.question_id = q.id
       WHERE q.lesson_id = ANY(${lessonIds as any})
    GROUP BY q.id, q.lesson_id, q.prompt, q.explanation
    ORDER BY q.lesson_id, q.id
    `;
    for (const row of questionsRes.rows) {
      const key = String(row.lesson_id);
      if (!questionsByLesson[key]) questionsByLesson[key] = [];
      questionsByLesson[key].push({
        id: Number(row.qid),
        prompt: row.prompt,
        explanation: row.explanation,
        access: row.access || null,
        choices: row.choices,
      });
    }
  }

  const summaryByLesson: LessonBundleRecord["summary"]["byLesson"] = {};
  for (const l of lessonsList) {
    const key = String(Number(l.id));
    const total = ensureArray(questionsByLesson[key]).length;
    summaryByLesson[key] = { total, correct: 0, incorrect: 0, attempted: 0 };
  }

  let player: LessonBundleRecord["player"] = null;
  const iframeSrc = extractIframeSrc(lesson.video_html || undefined);
  if (iframeSrc) {
    player = {
      provider: detectProviderFromSrc(iframeSrc) || null,
      iframeSrc,
      source: "bundle",
    };
  }

  const bundle: LessonBundleRecord = {
    lesson: {
      id: Number(lesson.id),
      slug: String(lesson.slug),
      title: String(lesson.title),
      courseId: Number(lesson.course_id),
      contentRev: Number(lesson.content_rev || 0),
      contentChangedAt: lesson.content_changed_at,
    },
    course,
    chapter,
    lessons: lessonsList,
    questionsByLesson,
    summary: { byLesson: summaryByLesson, lessonsCompleted: [] },
    player,
    html: String(lesson.body || ""),
    authors: lesson.meta && (lesson.meta.author || lesson.meta.reviewer)
      ? { author: lesson.meta.author || null, reviewer: lesson.meta.reviewer || null }
      : undefined,
    scope: "chapter",
  };

  const bundleJson = JSON.stringify(bundle);

  const upsert = await sql<{ updated_at: string }>`
    INSERT INTO lesson_bundles (lesson_id, slug, course_id, bundle, content_rev, updated_at)
    VALUES (${lesson.id}, ${lesson.slug}, ${lesson.course_id}, ${bundleJson}::jsonb, ${bundle.lesson.contentRev}, NOW())
    ON CONFLICT (lesson_id) DO UPDATE
    SET slug = EXCLUDED.slug,
        course_id = EXCLUDED.course_id,
        bundle = EXCLUDED.bundle,
        content_rev = EXCLUDED.content_rev,
        updated_at = NOW()
    RETURNING updated_at
  `;

  const updatedAt = upsert.rows[0]?.updated_at ?? new Date().toISOString();

  return {
    lessonId: Number(lesson.id),
    slug: String(lesson.slug),
    courseId: Number(lesson.course_id),
    contentRev: bundle.lesson.contentRev,
    updatedAt,
    bundle,
  };
}

export async function getLessonBundle(
  slug: string,
  options: { buildIfMissing?: boolean } = {}
): Promise<LessonBundleRow | null> {
  const { buildIfMissing = true } = options;
  const res = await sql<{
    lesson_id: number;
    slug: string;
    course_id: number;
    bundle: any;
    content_rev: number | null;
    updated_at: string;
  }>`
    SELECT lesson_id, slug, course_id, bundle, content_rev, updated_at
      FROM lesson_bundles
     WHERE slug = ${slug}
     LIMIT 1
  `;

  const row = res.rows[0];
  if (row) {
    return {
      lessonId: Number(row.lesson_id),
      slug: String(row.slug),
      courseId: Number(row.course_id),
      contentRev: Number(row.content_rev || 0),
      updatedAt: row.updated_at,
      bundle: parseBundle(row.bundle),
    };
  }

  if (!buildIfMissing) return null;
  return buildLessonBundle(slug);
}
