import { sql } from "@/lib/db";

export type LessonProgressLite = {
  id: number;
  slug: string;
  title: string;
  lengthMin: number | null;
  position: number;
  completed: boolean;
  qTotal: number;
  qCorrect: number;
  state?: "normal" | "locked" | "review" | "boss";
};

export type ChapterWithLessons = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  position: number;
  lessons: LessonProgressLite[];
};

export type CourseTimelineResult = {
  course: { id: number; slug: string; title: string; description: string | null };
  chapters: ChapterWithLessons[];
  nextCursor: string | null;
};

function encodeCursor(pos: number, id: number) {
  return `${pos}:${id}`;
}

function decodeCursor(cur?: string | null): { pos: number; id: number } | null {
  if (!cur) return null;
  const parts = String(cur).split(":");
  if (parts.length !== 2) return null;
  const pos = Number(parts[0]);
  const id = Number(parts[1]);
  if (!Number.isFinite(pos) || !Number.isFinite(id)) return null;
  return { pos, id };
}

export async function getCourseTimeline(
  opts: { courseSlug: string; userId?: number | null; limit?: number; cursor?: string | null }
): Promise<CourseTimelineResult> {
  const courseSlug = opts.courseSlug;
  const limit = Math.max(1, Math.min(20, Number(opts.limit ?? 4)));
  const cursor = decodeCursor(opts.cursor ?? null);
  const userId = Number(opts.userId || 0) || 0;

  const cr = await sql`
    SELECT id, slug, title, description
    FROM courses
    WHERE slug = ${courseSlug}
    LIMIT 1
  `;
  const courseRow = cr.rows[0] as any;
  if (!courseRow) throw new Error("course_not_found");
  const courseData = {
    id: Number(courseRow.id),
    slug: String(courseRow.slug ?? ''),
    title: String(courseRow.title ?? ''),
    description: courseRow.description ?? null,
  };

  const chaptersResult = cursor
    ? await sql`
        SELECT id, slug, title, description, position
        FROM chapters
        WHERE course_id = ${courseData.id}
          AND (position > ${cursor.pos} OR (position = ${cursor.pos} AND id > ${cursor.id}))
        ORDER BY position ASC, id ASC
        LIMIT ${limit}
      `
    : await sql`
        SELECT id, slug, title, description, position
        FROM chapters
        WHERE course_id = ${courseData.id}
        ORDER BY position ASC, id ASC
        LIMIT ${limit}
      `;

  const chapters = chaptersResult.rows as any[];
  if (chapters.length === 0) {
    return { course: courseData, chapters: [], nextCursor: null };
  }

  const chapterIds = chapters.map((row) => Number(row.id));

  const lessonResult = await sql`
    SELECT
      cl.chapter_id,
      l.id,
      l.slug,
      l.title,
      COALESCE(l.length_min, l.duration_min) AS length_min,
      cl.position,
      l.meta,
      COALESCE(
        NULLIF(l.slug, ''),
        lower(regexp_replace(COALESCE(l.title, ''), '\\s+', ' ', 'g')),
        'lesson_' || l.id::text
      ) AS progress_key
    FROM chapter_lessons cl
    JOIN lessons l ON l.id = cl.lesson_id
    WHERE cl.chapter_id = ANY(${chapterIds as any})
    ORDER BY cl.chapter_id ASC, cl.position ASC, l.id ASC
  `;

  const lessonRows = lessonResult.rows as any[];
  const lessonIds = lessonRows.map((row) => Number(row.id));
  const progressKeys = Array.from(
    new Set(
      lessonRows
        .map((row) => {
          const key = row.progress_key ? String(row.progress_key) : "";
          return key.trim();
        })
        .filter((key) => key.length > 0)
    )
  );

  const totalsByKey: Record<string, number> = {};
  if (progressKeys.length > 0) {
    const totalsResult = await sql`
      WITH per_lesson AS (
        SELECT
          COALESCE(
            NULLIF(l.slug, ''),
            lower(regexp_replace(COALESCE(l.title, ''), '\\s+', ' ', 'g')),
            'lesson_' || l.id::text
          ) AS key,
          COUNT(*)::int AS total
        FROM questions q
        JOIN lessons l ON l.id = q.lesson_id
        WHERE l.course_id = ${courseData.id}
          AND COALESCE(
            NULLIF(l.slug, ''),
            lower(regexp_replace(COALESCE(l.title, ''), '\\s+', ' ', 'g')),
            'lesson_' || l.id::text
          ) = ANY(${progressKeys as any})
        GROUP BY l.id, key
      )
      SELECT key, MAX(total)::int AS total
      FROM per_lesson
      GROUP BY key
    `;

    for (const row of totalsResult.rows as any[]) {
      const key = row.key ? String(row.key) : "";
      if (!key) continue;
      totalsByKey[key] = Number(row.total || 0);
    }
  }

  const correctByKey: Record<string, number> = {};
  if (userId && progressKeys.length > 0) {
    const correctResult = await sql`
      WITH per_lesson AS (
        SELECT
          COALESCE(
            NULLIF(l.slug, ''),
            lower(regexp_replace(COALESCE(l.title, ''), '\\s+', ' ', 'g')),
            'lesson_' || l.id::text
          ) AS key,
          COUNT(*)::int AS correct
        FROM user_question_progress uqp
        JOIN questions q ON q.id = uqp.question_id
        JOIN lessons l ON l.id = q.lesson_id
        WHERE uqp.user_id = ${userId}
          AND uqp.correct = true
          AND l.course_id = ${courseData.id}
          AND COALESCE(
            NULLIF(l.slug, ''),
            lower(regexp_replace(COALESCE(l.title, ''), '\\s+', ' ', 'g')),
            'lesson_' || l.id::text
          ) = ANY(${progressKeys as any})
        GROUP BY l.id, key
      )
      SELECT key, MAX(correct)::int AS correct
      FROM per_lesson
      GROUP BY key
    `;

    for (const row of correctResult.rows as any[]) {
      const key = row.key ? String(row.key) : "";
      if (!key) continue;
      correctByKey[key] = Number(row.correct || 0);
    }
  }

  const doneByKey: Record<string, boolean> = {};
  if (userId && progressKeys.length > 0) {
    const completedResult = await sql`
      SELECT
        COALESCE(
          NULLIF(l.slug, ''),
          lower(regexp_replace(COALESCE(l.title, ''), '\\s+', ' ', 'g')),
          'lesson_' || l.id::text
        ) AS key,
        BOOL_OR(ulp.completed) AS completed
      FROM user_lesson_progress ulp
      JOIN lessons l ON l.id = ulp.lesson_id
      WHERE ulp.user_id = ${userId}
        AND ulp.completed = true
        AND l.course_id = ${courseData.id}
        AND COALESCE(
          NULLIF(l.slug, ''),
          lower(regexp_replace(COALESCE(l.title, ''), '\\s+', ' ', 'g')),
          'lesson_' || l.id::text
        ) = ANY(${progressKeys as any})
      GROUP BY key
    `;

    for (const row of completedResult.rows as any[]) {
      const key = row.key ? String(row.key) : "";
      if (!key) continue;
      doneByKey[key] = !!row.completed;
    }
  }

  const prereqMap = new Map<number, number[]>();
  if (lessonIds.length > 0) {
    const prereqResult = await sql`
      SELECT lesson_id, requires_lesson_id
      FROM lesson_prerequisites
      WHERE lesson_id = ANY(${lessonIds as any})
    `;

    for (const row of prereqResult.rows as any[]) {
      const lid = Number(row.lesson_id);
      const requires = Number(row.requires_lesson_id);
      if (!Number.isFinite(lid) || !Number.isFinite(requires)) continue;
      const list = prereqMap.get(lid) ?? [];
      list.push(requires);
      prereqMap.set(lid, list);
    }
  }

  const needsIds = new Set<number>(lessonIds);
  for (const reqs of prereqMap.values()) {
    for (const r of reqs) needsIds.add(Number(r));
  }

  const doneLessonIds = new Set<number>();
  if (userId && needsIds.size > 0) {
    const doneLessonsResult = await sql`
      SELECT lesson_id
      FROM user_lesson_progress
      WHERE user_id = ${userId}
        AND completed = true
        AND lesson_id = ANY(${Array.from(needsIds) as any})
    `;

    for (const row of doneLessonsResult.rows as any[]) {
      const lid = Number(row.lesson_id);
      if (Number.isFinite(lid)) doneLessonIds.add(lid);
    }
  }

  const lessonsByChapter = new Map<number, LessonProgressLite[]>();

  for (const row of lessonRows) {
    const chapterId = Number(row.chapter_id);
    const lessonId = Number(row.id);
    const key = row.progress_key ? String(row.progress_key) : "";
    const arr = lessonsByChapter.get(chapterId) ?? [];

    let state: LessonProgressLite["state"] = "normal";
    let meta: any = null;
    try {
      meta = row.meta ? (typeof row.meta === "string" ? JSON.parse(row.meta) : row.meta) : null;
    } catch {}
    const kind = (meta?.kind || meta?.type || "").toLowerCase();
    if (kind === "review") state = "review";
    else if (kind === "boss" || kind === "checkpoint") state = "boss";

    const reqs = prereqMap.get(lessonId);
    if (reqs && reqs.length > 0) {
      const missing = reqs.some((req) => !doneLessonIds.has(Number(req)));
      if (missing) state = "locked";
    }

    const qTotal = totalsByKey[key] || 0;
    const qCorrect = Math.min(qTotal, correctByKey[key] || 0);

    arr.push({
      id: lessonId,
      slug: row.slug ? String(row.slug) : "",
      title: row.title ? String(row.title) : "",
      lengthMin: row.length_min != null ? Number(row.length_min) : null,
      position: Number(row.position || 0),
      completed: !!doneByKey[key],
      qTotal,
      qCorrect,
      state,
    });

    lessonsByChapter.set(chapterId, arr);
  }

  const outChapters: ChapterWithLessons[] = chapters
    .filter((chapter) => {
      const title = String(chapter.title || "").toLowerCase().trim();
      const slug = String(chapter.slug || "").toLowerCase().trim();
      return !(
        title.includes("all lessons") ||
        slug === "all" ||
        slug === "all-lessons" ||
        slug === "all_lessons"
      );
    })
    .map((chapter) => ({
      id: Number(chapter.id),
      slug: String(chapter.slug ?? ''),
      title: String(chapter.title ?? ''),
      description: chapter.description ?? null,
      position: Number(chapter.position || 0),
      lessons: lessonsByChapter.get(Number(chapter.id)) || [],
    }));

  const lastChapter = chapters[chapters.length - 1];
  const nextCursor = lastChapter ? encodeCursor(Number(lastChapter.position || 0), Number(lastChapter.id)) : null;

  return { course: courseData, chapters: outChapters, nextCursor };
}
