import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireUserId } from "@/lib/study/auth";
import { checkCourseAccess } from "@/lib/lesson/access";
import { extractIframeSrc, detectProviderFromSrc, isPremiumSrc } from "@/lib/video/embed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Returns a bundled payload for a lesson slug.
// - Requires login (so questions are never served to guests)
// - Batches questions for the entire chapter by default
// - Includes a compact course progress snapshot if present
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") || "chapter"; // chapter | lesson

  // Resolve lesson + course (include body and video_html for optional embeds)
  const lr = await sql`SELECT id, slug, title, course_id, body, video_html, meta, content_rev, content_changed_at FROM lessons WHERE slug=${params.slug} LIMIT 1`;
  const lesson = lr.rows[0];
  if (!lesson) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const cr = await sql`SELECT id, slug, title, visibility, meta FROM courses WHERE id=${lesson.course_id} LIMIT 1`;
  const course = cr.rows[0] ? { id: Number(cr.rows[0].id), slug: String(cr.rows[0].slug), title: String(cr.rows[0].title) } : null;

  // Gate paid access (multiple paid courses supported via per-course entitlements)
  const access = await checkCourseAccess(userId, Number(lesson.course_id));
  if (access.accessType === 'paid' && !access.allowed) {
    const res = NextResponse.json({ error: 'forbidden', reason: 'paid_course' }, { status: 403 });
    // Throttle repeated attempts for this course for ~10 minutes
    res.cookies.set(`ems_paid_denied_${Number(lesson.course_id)}`, String(Date.now()), { maxAge: 600, path: '/' });
    // Also set a slug-based cookie to let middleware short-circuit without DB
    try { res.cookies.set(`ems_paid_denied_l_${params.slug}`, '1', { maxAge: 600, path: '/' }); } catch {}
    return res;
  }

  // Resolve chapter containing this lesson (first one by position)
  const ch = await sql`SELECT c.id, c.slug, c.title, c.position, cl.chapter_id
                        FROM chapter_lessons cl
                        JOIN chapters c ON c.id = cl.chapter_id
                       WHERE cl.lesson_id=${lesson.id}
                    ORDER BY cl.position ASC, cl.chapter_id ASC
                       LIMIT 1`;
  const chapterId = ch.rows[0]?.chapter_id ? Number(ch.rows[0].chapter_id) : 0;
  let chapter: any = null;
  let chapterLessons: any[] = [];
  let lessonIds: number[] = [Number(lesson.id)];
  if (chapterId) {
    chapter = {
      id: Number(ch.rows[0].id),
      slug: String(ch.rows[0].slug),
      title: String(ch.rows[0].title),
      position: Number(ch.rows[0].position || 0),
    };
    const lsr = await sql`SELECT l.id, l.slug, l.title, cl.position
                            FROM chapter_lessons cl
                            JOIN lessons l ON l.id = cl.lesson_id
                           WHERE cl.chapter_id=${chapterId}
                        ORDER BY cl.position ASC, l.id ASC`;
    chapterLessons = lsr.rows.map((r:any)=>({ id: Number(r.id), slug: String(r.slug), title: String(r.title), position: Number(r.position||0) }));
    if (scope === "chapter") lessonIds = chapterLessons.map((l:any)=> Number(l.id));
  }

  // Batch load questions (choices aggregated per question) for the chosen scope
  let questionsByLesson: Record<string, any[]> = {};
  if (lessonIds.length) {
    const qr = await sql`SELECT q.id as qid, q.lesson_id, q.prompt, q.explanation,
                                COALESCE(json_agg(json_build_object('id', c.id, 'text', c.content, 'correct', c.correct)
                                                 ORDER BY c.id) FILTER (WHERE c.id IS NOT NULL), '[]'::json) AS choices
                           FROM questions q
                           LEFT JOIN choices c ON c.question_id = q.id
                          WHERE q.lesson_id = ANY(${lessonIds as any})
                       GROUP BY q.id, q.lesson_id, q.prompt, q.explanation
                       ORDER BY q.lesson_id, q.id`;
    for (const r of qr.rows) {
      const lid = String(Number(r.lesson_id));
      if (!questionsByLesson[lid]) questionsByLesson[lid] = [];
      questionsByLesson[lid].push({ id: Number(r.qid), prompt: r.prompt, explanation: r.explanation, choices: r.choices });
    }
  }

  // Compact progress snapshot for this course (may be empty initially)
  let progress: any = { lessons: {}, questions: {}, xpTotal: 0, version: 1, updatedAt: null };
  try {
    const pr = await sql`SELECT data, xp_total, version, updated_at FROM user_course_progress_compact WHERE user_id=${userId} AND course_id=${lesson.course_id} LIMIT 1`;
    if (pr.rows[0]) {
      progress = {
        ...(pr.rows[0].data || {}),
        xpTotal: Number(pr.rows[0].xp_total || 0),
        version: Number(pr.rows[0].version || 1),
        updatedAt: pr.rows[0].updated_at || null,
      };
    }
  } catch {}

  // Optional includes to reduce client calls: include=player,body
  const include = new Set((url.searchParams.get('include') || '').split(',').map((s)=>s.trim()).filter(Boolean));
  let player: any = undefined;
  let html: string | undefined = undefined;
  if (include.has('player')) {
    let iframeSrc: string | null = extractIframeSrc(String((lesson as any).video_html || ''));
    let locked = false; let lockReason: string | undefined;
    const provider = detectProviderFromSrc(iframeSrc || undefined);
    if (iframeSrc) {
      const access = await checkCourseAccess(userId, Number(lesson.course_id));
      if (access.accessType === 'paid' && !access.allowed) {
        locked = true; lockReason = 'paid_course';
        if (isPremiumSrc(iframeSrc)) iframeSrc = null;
      }
    }
    player = { provider, iframeSrc, locked, lockReason, source: 'bundle' };
  }
  if (include.has('body')) {
    html = String((lesson as any).body || '');
  }

  // Build lightweight chapter summary (per-lesson counts + completion) to avoid extra requests on client
  let summary: any = null;
  try {
    const byLesson: Record<string, { total: number; correct: number; incorrect: number; attempted: number }> = {};
    for (const l of chapterLessons.length ? chapterLessons : [{ id: Number(lesson.id) }]) {
      byLesson[String(Number(l.id))] = { total: 0, correct: 0, incorrect: 0, attempted: 0 };
    }
    // Use already fetched questionsByLesson when available; otherwise compute totals by querying
    if (Object.keys(questionsByLesson).length) {
      for (const [lid, arr] of Object.entries<any[]>(questionsByLesson)) {
        const stats = byLesson[lid] || (byLesson[lid] = { total: 0, correct: 0, incorrect: 0, attempted: 0 });
        stats.total = arr.length;
        for (const q of arr) {
          const st = (progress.questions || {})[Number(q.id)]?.status;
          if (st === 'correct') { stats.correct++; stats.attempted++; }
          else if (st === 'incorrect') { stats.incorrect++; stats.attempted++; }
        }
      }
    } else if (lessonIds.length) {
      const qr = await sql`SELECT lesson_id, COUNT(*)::int AS n FROM questions WHERE lesson_id = ANY(${lessonIds as any}) GROUP BY lesson_id`;
      for (const r of qr.rows) {
        const key = String(Number(r.lesson_id));
        const stats = byLesson[key] || (byLesson[key] = { total: 0, correct: 0, incorrect: 0, attempted: 0 });
        stats.total = Number(r.n || 0);
      }
      // For attempted/correct/incorrect, rely on progress map
      for (const [qid, v] of Object.entries<any>(progress.questions || {})) {
        // We don't have q->lesson quickly; skip in this fallback to keep it cheap
      }
    }
    const lessonsCompleted = Object.keys(progress.lessons || {}).map((k) => Number(k)).filter((id) => (chapterLessons.length ? chapterLessons.some((l:any)=> Number(l.id)===id) : id===Number(lesson.id)));
    summary = { byLesson, lessonsCompleted };
  } catch {}

  return NextResponse.json({
    lesson: { id: Number(lesson.id), slug: String(lesson.slug), title: String(lesson.title), courseId: Number(lesson.course_id), contentRev: Number((lesson as any).content_rev || 0), contentChangedAt: (lesson as any).content_changed_at || null },
    course,
    chapter,
    lessons: chapterLessons,
    questionsByLesson,
    progress,
    player,
    html,
    authors: ((lesson as any).meta && (((lesson as any).meta as any).author || ((lesson as any).meta as any).reviewer)) ? { author: ((lesson as any).meta as any).author || null, reviewer: ((lesson as any).meta as any).reviewer || null } : undefined,
    summary,
    scope,
  });
}
