import { sql } from "@/lib/db";

export type LessonProgressLite = {
  id: number;
  slug: string;
  title: string;
  lengthMin: number | null;
  position: number;
  // progress bits for client animation
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
  nextCursor: string | null; // cursor = `${position}:${id}` of last chapter returned
};

function encodeCursor(pos: number, id: number) {
  return `${pos}:${id}`;
}

function decodeCursor(cur?: string | null): { pos: number; id: number } | null {
  if (!cur) return null;
  const m = String(cur).split(":");
  if (m.length !== 2) return null;
  const pos = Number(m[0]);
  const id = Number(m[1]);
  if (!Number.isFinite(pos) || !Number.isFinite(id)) return null;
  return { pos, id };
}

// Efficient, batched fetch of a course timeline slice.
// - Paginates by chapters (not lessons) with a stable (position, id) cursor
// - Returns per-lesson progress aggregates for the given user (if any)
export async function getCourseTimeline(
  opts: { courseSlug: string; userId?: number | null; limit?: number; cursor?: string | null }
): Promise<CourseTimelineResult> {
  const courseSlug = opts.courseSlug;
  const limit = Math.max(1, Math.min(20, Number(opts.limit ?? 4))); // small page for fast paint
  const cursor = decodeCursor(opts.cursor ?? null);
  const userId = Number(opts.userId || 0) || 0;

  // Load course
  const cr = await sql`SELECT id, slug, title, description FROM courses WHERE slug=${courseSlug} LIMIT 1`;
  const course = cr.rows[0];
  if (!course) throw new Error("course_not_found");

  // Select a page of chapters using a keyset cursor (position, id)
  let chaptersRows;
  if (cursor) {
    chaptersRows = await sql`
      SELECT id, slug, title, description, position
      FROM chapters
      WHERE course_id=${course.id}
        AND (position > ${cursor.pos} OR (position = ${cursor.pos} AND id > ${cursor.id}))
      ORDER BY position ASC, id ASC
      LIMIT ${limit}
    `;
  } else {
    chaptersRows = await sql`
      SELECT id, slug, title, description, position
      FROM chapters
      WHERE course_id=${course.id}
      ORDER BY position ASC, id ASC
      LIMIT ${limit}
    `;
  }

  const chapters = chaptersRows.rows as any[];
  // Fallback: if a course has no explicit chapters yet, expose a single virtual chapter
  if (chapters.length === 0) {
    // Load all lessons for the course in rank order
    const lr = await sql`
      SELECT l.id, l.slug, l.title, COALESCE(l.length_min, l.duration_min) as length_min, COALESCE(l.rank_key,'') as rk, l.meta
      FROM lessons l
      WHERE l.course_id=${course.id}
      ORDER BY COALESCE(l.rank_key,'') ASC, l.id ASC`;
    const lessonRows = lr.rows as any[];
    const lessonIds = lessonRows.map((r)=> Number(r.id));
    const qTotals: Record<number, number> = {};
    if (lessonIds.length > 0) {
      const qt = await sql`SELECT lesson_id, COUNT(*)::int AS total FROM questions WHERE lesson_id = ANY(${lessonIds as any}) GROUP BY lesson_id`;
      for (const r of qt.rows) qTotals[Number(r.lesson_id)] = Number(r.total || 0);
    }
    const qCorrect: Record<number, number> = {};
    const done = new Set<number>();
    if (userId && lessonIds.length > 0) {
      const qc = await sql`
        SELECT q.lesson_id, COUNT(*)::int AS cnt
        FROM user_question_progress uqp JOIN questions q ON q.id=uqp.question_id
        WHERE uqp.user_id=${userId} AND uqp.correct=true AND q.lesson_id = ANY(${lessonIds as any})
        GROUP BY q.lesson_id`;
      for (const r of qc.rows) qCorrect[Number(r.lesson_id)] = Number(r.cnt || 0);
      const dc = await sql`SELECT lesson_id FROM user_lesson_progress WHERE user_id=${userId} AND lesson_id = ANY(${lessonIds as any}) AND completed=true`;
      for (const r of dc.rows) done.add(Number(r.lesson_id));
    }
    // Map to lessons
    const lessonsLite = lessonRows.map((r, idx) => {
      let state: "normal" | "locked" | "review" | "boss" = "normal";
      try { const meta = r.meta ? (typeof r.meta === 'string' ? JSON.parse(r.meta) : r.meta) : null; const kind = (meta?.kind || meta?.type || '').toLowerCase(); if (kind === 'review') state = 'review'; else if (kind === 'boss' || kind === 'checkpoint') state = 'boss'; } catch {}
      return {
        id: Number(r.id),
        slug: String(r.slug),
        title: String(r.title),
        lengthMin: r.length_min != null ? Number(r.length_min) : null,
        position: idx + 1,
        completed: done.has(Number(r.id)),
        qTotal: qTotals[Number(r.id)] || 0,
        qCorrect: qCorrect[Number(r.id)] || 0,
        state,
      } as LessonProgressLite;
    });
    const outChapters: ChapterWithLessons[] = [{ id: 0, slug: 'all', title: 'All Lessons', description: null, position: 1, lessons: lessonsLite }];
    return { course, chapters: outChapters, nextCursor: null } as any;
  }

  const chapterIds = chapters.map((r) => Number(r.id));

  // Fetch lessons for these chapters in one go
  const lr = await sql`
    SELECT cl.chapter_id, l.id, l.slug, l.title, COALESCE(l.length_min, l.duration_min) as length_min, cl.position, l.meta
    FROM chapter_lessons cl
    JOIN lessons l ON l.id = cl.lesson_id
    WHERE cl.chapter_id = ANY (${chapterIds as any})
    ORDER BY cl.chapter_id ASC, cl.position ASC, l.id ASC
  `;

  const lessonRows = lr.rows as any[];
  const lessonIds = lessonRows.map((r) => Number(r.id));

  // Question totals per lesson
  const qTotals: Record<number, number> = {};
  if (lessonIds.length > 0) {
    const qt = await sql`SELECT lesson_id, COUNT(*)::int AS total FROM questions WHERE lesson_id = ANY(${lessonIds as any}) GROUP BY lesson_id`;
    for (const r of qt.rows) qTotals[Number(r.lesson_id)] = Number(r.total || 0);
  }

  // User-correct counts per lesson (optional)
  const qCorrect: Record<number, number> = {};
  if (userId && lessonIds.length > 0) {
    const qc = await sql`
      SELECT q.lesson_id, COUNT(*)::int AS cnt
      FROM user_question_progress uqp
      JOIN questions q ON q.id = uqp.question_id
      WHERE uqp.user_id=${userId} AND uqp.correct=true AND q.lesson_id = ANY(${lessonIds as any})
      GROUP BY q.lesson_id
    `;
    for (const r of qc.rows) qCorrect[Number(r.lesson_id)] = Number(r.cnt || 0);
  }

  // Lesson completion flags
  const done = new Set<number>();
  if (userId && lessonIds.length > 0) {
    const dc = await sql`SELECT lesson_id FROM user_lesson_progress WHERE user_id=${userId} AND lesson_id = ANY(${lessonIds as any}) AND completed=true`;
    for (const r of dc.rows) done.add(Number(r.lesson_id));
  }

  // Prerequisites for lock state
  const prereqMap = new Map<number, number[]>();
  if (lessonIds.length > 0) {
    try {
      const pr = await sql`SELECT lesson_id, requires_lesson_id FROM lesson_prerequisites WHERE lesson_id = ANY(${lessonIds as any})`;
      for (const r of pr.rows) {
        const lid = Number(r.lesson_id);
        const arr = prereqMap.get(lid) || [];
        arr.push(Number(r.requires_lesson_id));
        prereqMap.set(lid, arr);
      }
    } catch {}
  }

  // Group lessons by chapter
  const byChapter = new Map<number, LessonProgressLite[]>();
  for (const r of lessonRows) {
    const chapterId = Number(r.chapter_id);
    const lid = Number(r.id);
    const arr = byChapter.get(chapterId) || [];
    // Determine state
    let state: "normal" | "locked" | "review" | "boss" = "normal";
    try {
      const meta = r.meta ? (typeof r.meta === 'string' ? JSON.parse(r.meta) : r.meta) : null;
      const kind = (meta?.kind || meta?.type || '').toLowerCase();
      if (kind === 'review') state = 'review';
      else if (kind === 'boss' || kind === 'checkpoint') state = 'boss';
    } catch {}
    // lock if prerequisites not all done
    const reqs = prereqMap.get(lid);
    if (reqs && reqs.length > 0) {
      let ok = true;
      for (const q of reqs) { if (!done.has(Number(q))) { ok = false; break; } }
      if (!ok) state = 'locked';
    }

    arr.push({
      id: lid,
      slug: String(r.slug),
      title: String(r.title),
      lengthMin: r.length_min != null ? Number(r.length_min) : null,
      position: Number(r.position || 0),
      completed: done.has(lid),
      qTotal: qTotals[lid] || 0,
      qCorrect: qCorrect[lid] || 0,
      state,
    });
    byChapter.set(chapterId, arr);
  }

  const outChapters: ChapterWithLessons[] = chapters.map((c) => ({
    id: Number(c.id),
    slug: String(c.slug),
    title: String(c.title),
    description: c.description ?? null,
    position: Number(c.position || 0),
    lessons: byChapter.get(Number(c.id)) || [],
  }));

  const last = chapters[chapters.length - 1];
  const nextCursor = last ? encodeCursor(Number(last.position || 0), Number(last.id)) : null;

  return { course, chapters: outChapters, nextCursor } as any;
}
