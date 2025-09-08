import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  const lr = await sql`SELECT id, slug, title, course_id FROM lessons WHERE slug=${slug} LIMIT 1`;
  const lesson = lr.rows[0];
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const br = await sql`SELECT id, kind, content FROM lesson_blocks WHERE lesson_id=${lesson.id} ORDER BY COALESCE(rank_key,'')`;
  const cr = await sql`SELECT id, slug, title FROM courses WHERE id=${lesson.course_id} LIMIT 1`;
  // Compute prev/next based on rank_key within the same course
  const lr2 = await sql`SELECT id, slug, title, COALESCE(rank_key,'') as rk FROM lessons WHERE course_id=${lesson.course_id} ORDER BY COALESCE(rank_key,'') ASC, slug ASC`;
  const ordered = lr2.rows as any[];
  const idx = ordered.findIndex((l:any)=> Number(l.id) === Number(lesson.id));
  const prev = idx>0 ? { slug: ordered[idx-1].slug, title: ordered[idx-1].title } : null;
  const next = idx>=0 && idx < ordered.length-1 ? { slug: ordered[idx+1].slug, title: ordered[idx+1].title } : null;
  // Preload question counts per lesson for sidebar drilldown
  let qCountByLesson = new Map<number, number>();
  try {
    if (ordered.length > 0) {
      const ids = ordered.map((o:any)=> Number(o.id));
      const qr = await sql`SELECT lesson_id, COUNT(*)::int AS cnt FROM questions WHERE lesson_id = ANY(${ids}) GROUP BY lesson_id`;
      for (const r of qr.rows) qCountByLesson.set(Number(r.lesson_id), Number(r.cnt));
    }
  } catch {}
  // Per-user course progress (if authenticated)
  let courseProgress: any = null;
  let timelineLessons: any[] | null = null;
  try {
    const session = await getServerSession(authOptions as any);
    let userId = session && (session as any).userId ? Number((session as any).userId) : 0;
    if (!Number.isSafeInteger(userId) || userId <= 0 || userId > 2147483647) userId = 0;
    if (!userId && (session as any)?.user?.email) {
      const email = String((session as any).user.email).toLowerCase();
      const ur = await sql`SELECT id FROM users WHERE email=${email} LIMIT 1`;
      if (ur.rows[0]?.id) userId = Number(ur.rows[0].id);
    }
    if (userId) {
      const totalR = await sql`SELECT COUNT(*)::int AS total FROM lessons WHERE course_id=${lesson.course_id}`;
      const compR = await sql`SELECT COUNT(*)::int AS completed FROM user_lesson_progress ulp JOIN lessons l ON l.id=ulp.lesson_id WHERE ulp.user_id=${userId} AND l.course_id=${lesson.course_id} AND ulp.completed=true`;
      const total = Number(totalR.rows[0]?.total || 0);
      const completed = Number(compR.rows[0]?.completed || 0);
      const pct = total ? Math.round((completed / total) * 100) : 0;
      courseProgress = { total, completed, pct };
      // Build timeline with completion flags
      const cr = await sql`SELECT lesson_id FROM user_lesson_progress WHERE user_id=${userId} AND completed=true`;
      const done = new Set<number>(cr.rows.map((r:any)=> Number(r.lesson_id)));
      timelineLessons = ordered.map((l:any)=> ({ id: Number(l.id), slug: l.slug, title: l.title, completed: done.has(Number(l.id)), qCount: qCountByLesson.get(Number(l.id)) ?? 0 }));
    } else {
      timelineLessons = ordered.map((l:any)=> ({ id: Number(l.id), slug: l.slug, title: l.title, completed: false, qCount: qCountByLesson.get(Number(l.id)) ?? 0 }));
    }
  } catch { /* ignore, courseProgress stays null */ }
  return NextResponse.json({ lesson: { id: lesson.id, slug: lesson.slug, title: lesson.title }, course: cr.rows[0], blocks: br.rows, nav: { prev, next }, courseProgress, timeline: { lessons: timelineLessons ?? ordered.map((l:any)=> ({ id: Number(l.id), slug: l.slug, title: l.title, completed: false, qCount: qCountByLesson.get(Number(l.id)) ?? 0 })) } });
}
