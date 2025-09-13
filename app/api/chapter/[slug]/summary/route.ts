import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireUserId } from "@/lib/study/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const userId = await requireUserId(req).catch(() => null);
  // Resolve chapter by slug and lessons
  const cr = await sql`SELECT id, slug, title FROM chapters WHERE slug=${params.slug} LIMIT 1`;
  const ch = cr.rows[0];
  if (!ch) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const lsr = await sql`SELECT l.id, l.slug, l.title, cl.position, l.course_id
                          FROM chapter_lessons cl JOIN lessons l ON l.id=cl.lesson_id
                         WHERE cl.chapter_id=${ch.id}
                      ORDER BY cl.position ASC, l.id ASC`;
  const lessons = lsr.rows.map((r:any)=>({ id: Number(r.id), slug: String(r.slug), title: String(r.title), position: Number(r.position||0) }));
  const courseId = Number(lsr.rows[0]?.course_id || 0);
  const lessonIds = lessons.map((l)=> Number(l.id));

  // Totals per lesson
  const totals: Record<string, number> = {};
  if (lessonIds.length) {
    const qr = await sql`SELECT lesson_id, COUNT(*)::int AS n FROM questions WHERE lesson_id = ANY(${lessonIds as any}) GROUP BY lesson_id`;
    for (const r of qr.rows) totals[String(Number(r.lesson_id))] = Number(r.n||0);
  }

  // Progress map (if authed)
  let progress: any = null;
  if (userId && courseId) {
    try {
      const pr = await sql`SELECT data FROM user_course_progress_compact WHERE user_id=${userId} AND course_id=${courseId} LIMIT 1`;
      progress = pr.rows[0]?.data || { lessons: {}, questions: {} };
    } catch {}
  }

  const byLesson: Record<string, { total: number; correct: number; incorrect: number; attempted: number }> = {};
  for (const l of lessons) {
    byLesson[String(l.id)] = { total: totals[String(l.id)] || 0, correct: 0, incorrect: 0, attempted: 0 };
  }
  if (progress) {
    // Count attempted per lesson by scanning questions table mapping
    const qmap = progress.questions || {};
    if (Object.keys(qmap).length) {
      // Map question->lesson id in a single query for attempted ones only
      const qids = Object.keys(qmap).map((x)=> Number(x)).filter((n)=> Number.isFinite(n));
      if (qids.length) {
        const lm = await sql`SELECT id, lesson_id FROM questions WHERE id = ANY(${qids as any})`;
        const inv: Record<number, number> = {}; for (const r of lm.rows) inv[Number(r.id)] = Number(r.lesson_id);
        for (const [qidRaw, v] of Object.entries<any>(qmap)) {
          const qid = Number(qidRaw); const lid = inv[qid]; if (!lid) continue;
          const st = v?.status;
          const s = byLesson[String(lid)]; if (!s) continue;
          if (st === 'correct') { s.correct++; s.attempted++; }
          else if (st === 'incorrect') { s.incorrect++; s.attempted++; }
        }
      }
    }
  }
  const lessonsCompleted = progress ? Object.keys(progress.lessons||{}).map((k)=> Number(k)).filter((id)=> lessonIds.includes(id)) : [];

  return NextResponse.json({
    chapter: { id: Number(ch.id), slug: String(ch.slug), title: String(ch.title) },
    lessons,
    summary: { byLesson, lessonsCompleted },
  });
}
