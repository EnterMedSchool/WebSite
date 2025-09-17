import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkCourseAccess, entitlementCookieOptions } from "@/lib/lesson/access";
import { courseTokenName } from "@/lib/lesson/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  const lr = await sql`SELECT id, slug, title, course_id FROM lessons WHERE slug=${slug} LIMIT 1`;
  const lesson = lr.rows[0];
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let tokenToSet: { value: string; expiresAt: number } | null = null;

  // Gate paid courses for this route as well
  try {
    const session = await getServerSession(authOptions as any);
    let userId = session && (session as any).userId ? Number((session as any).userId) : 0;
    if (!Number.isSafeInteger(userId) || userId <= 0 || userId > 2147483647) userId = 0;
    const access = await checkCourseAccess(userId || 0, Number(lesson.course_id), { req });
    if (access.accessType === 'paid' && !access.allowed) {
      const deny = NextResponse.json({ error: 'forbidden', reason: 'paid_course' }, { status: 403 });
      deny.cookies.set(`ems_paid_denied_${Number(lesson.course_id)}`, String(Date.now()), { maxAge: 600, path: '/' });
      try { deny.cookies.set(`ems_paid_denied_l_${slug}`, '1', { maxAge: 600, path: '/' }); } catch {}
      if (access.clearToken) {
        try { deny.cookies.set(courseTokenName(Number(lesson.course_id)), '', { maxAge: 0, path: '/' }); } catch {}
      }
      return deny;
    }
    if (access.tokenToSet) tokenToSet = access.tokenToSet;
  } catch {}

  const br = await sql`SELECT id, kind, content FROM lesson_blocks WHERE lesson_id=${lesson.id} ORDER BY COALESCE(rank_key,'')`;
  const cr = await sql`SELECT id, slug, title FROM courses WHERE id=${lesson.course_id} LIMIT 1`;

  // Course-wide prev/next via rank_key
  const lr2 = await sql`SELECT id, slug, title, COALESCE(rank_key,'') as rk FROM lessons WHERE course_id=${lesson.course_id} ORDER BY COALESCE(rank_key,'') ASC, slug ASC`;
  const ordered = lr2.rows as any[];
  const idx = ordered.findIndex((l:any)=> Number(l.id) === Number(lesson.id));
  const prev = idx>0 ? { slug: ordered[idx-1].slug, title: ordered[idx-1].title } : null;
  const next = idx>=0 && idx < ordered.length-1 ? { slug: ordered[idx+1].slug, title: ordered[idx+1].title } : null;

  // Chapter containing this lesson
  const ch = await sql`SELECT c.id, c.slug, c.title, c.position, cl.chapter_id FROM chapter_lessons cl JOIN chapters c ON c.id=cl.chapter_id WHERE cl.lesson_id=${lesson.id} ORDER BY cl.position ASC, cl.chapter_id ASC LIMIT 1`;
  const chapterId = ch.rows[0]?.chapter_id ? Number(ch.rows[0].chapter_id) : 0;
  const chapterObj = ch.rows[0] ? { id: Number(ch.rows[0].id), slug: String(ch.rows[0].slug), title: String(ch.rows[0].title), position: Number(ch.rows[0].position || 0) } : null;

  // Question counts across course (for qCount badges)
  const qCountByLesson = new Map<number, number>();
  try {
    const qr = await sql`SELECT q.lesson_id, COUNT(*)::int AS cnt FROM questions q WHERE q.lesson_id IN (SELECT id FROM lessons WHERE course_id=${lesson.course_id}) GROUP BY q.lesson_id`;
    for (const r of qr.rows) qCountByLesson.set(Number(r.lesson_id), Number(r.cnt));
  } catch {}

  let courseProgress: any = null;
  let timelineLessons: any[] | null = null;
  let chapterProgress: any = null;
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
    }

    if (chapterId) {
      const rows = await sql`SELECT l.id, l.slug, l.title, COALESCE(l.length_min, l.duration_min) AS length_min, cl.position FROM chapter_lessons cl JOIN lessons l ON l.id = cl.lesson_id WHERE cl.chapter_id=${chapterId} ORDER BY cl.position ASC, l.id ASC LIMIT 20`;
      const ids = rows.rows.map((r:any)=> Number(r.id));
      const doneSet = new Set<number>();
      if (userId && ids.length > 0) {
        const dr = await sql`SELECT lesson_id FROM user_lesson_progress WHERE user_id=${userId} AND lesson_id = ANY(${ids as any}) AND completed=true`;
        for (const r of dr.rows) doneSet.add(Number(r.lesson_id));
      }
      timelineLessons = rows.rows.map((r:any)=> ({ id: Number(r.id), slug: String(r.slug), title: String(r.title), completed: doneSet.has(Number(r.id)), qCount: qCountByLesson.get(Number(r.id)) ?? 0 }));

      // Chapter progress across all lessons in chapter (not just the limited 20)
      const totR = await sql`SELECT COUNT(*)::int AS total FROM chapter_lessons WHERE chapter_id=${chapterId}`;
      const totalInChapter = Number(totR.rows[0]?.total || 0);
      let completedInChapter = 0;
      if (userId) {
        const compC = await sql`SELECT COUNT(*)::int AS completed FROM user_lesson_progress ulp WHERE ulp.user_id=${userId} AND ulp.completed=true AND ulp.lesson_id IN (SELECT lesson_id FROM chapter_lessons WHERE chapter_id=${chapterId})`;
        completedInChapter = Number(compC.rows[0]?.completed || 0);
      }
      const idxR = await sql`SELECT ROW_NUMBER() OVER (ORDER BY cl.position ASC, l.id ASC) - 1 AS idx FROM chapter_lessons cl JOIN lessons l ON l.id=cl.lesson_id WHERE cl.chapter_id=${chapterId} AND cl.lesson_id=${lesson.id}`;
      const idxInChapter = Number(idxR.rows[0]?.idx ?? 0);
      chapterProgress = { total: totalInChapter, completed: completedInChapter, index: idxInChapter };
    } else {
      const slice = ordered.slice(Math.max(0, idx - 10), idx + 10).slice(0, 20);
      timelineLessons = slice.map((l:any)=> ({ id: Number(l.id), slug: l.slug, title: l.title, completed: false, qCount: qCountByLesson.get(Number(l.id)) ?? 0 }));
      chapterProgress = null;
    }
  } catch {}

  const res = NextResponse.json({
    lesson: { id: lesson.id, slug: lesson.slug, title: lesson.title },
    course: cr.rows[0],
    chapter: chapterObj,
    blocks: br.rows,
    nav: { prev, next },
    courseProgress,
    chapterProgress,
    timeline: { lessons: timelineLessons ?? [] }
  });

  if (tokenToSet) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    res.cookies.set(courseTokenName(Number(lesson.course_id)), tokenToSet.value, entitlementCookieOptions(tokenToSet.expiresAt, nowSeconds));
  }

  return res;
}
