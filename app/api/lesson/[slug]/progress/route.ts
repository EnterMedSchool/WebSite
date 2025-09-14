import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireUserId } from "@/lib/study/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const isAuthConfigured = Boolean(process.env.NEXTAUTH_SECRET);
    if (!isAuthConfigured) {
      return NextResponse.json({ error: 'auth_not_configured' }, { status: 401 });
    }
    const body = await req.json().catch(()=>({}));
    const hasProgress = Object.prototype.hasOwnProperty.call(body, "progress");
    const progressInput = hasProgress ? Math.max(0, Math.min(100, Number(body.progress))) : null;
    const hasCompleted = Object.prototype.hasOwnProperty.call(body, "completed");
    const userId = await requireUserId(req);
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const lr = await sql`SELECT id, length_min FROM lessons WHERE slug=${params.slug} LIMIT 1`;
    const lesson = lr.rows[0];
    if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Preserve completed flag if not explicitly set
    let completed: boolean;
    if (hasCompleted) {
      completed = !!(body as any).completed;
    } else {
      const existing = await sql`SELECT completed FROM user_lesson_progress WHERE user_id=${userId} AND lesson_id=${lesson.id} LIMIT 1`;
      completed = existing.rows.length ? !!existing.rows[0].completed : (progressInput === 100);
    }

    const progressToSet = completed ? 100 : Number(progressInput ?? 0);

    // Upsert progress
    try {
      await sql`INSERT INTO user_lesson_progress (user_id, lesson_id, progress, completed)
                VALUES (${userId}, ${lesson.id}, ${progressToSet}, ${completed})
                ON CONFLICT (user_id, lesson_id) DO UPDATE SET
                  completed=EXCLUDED.completed,
                  progress=CASE
                             WHEN EXCLUDED.completed THEN GREATEST(user_lesson_progress.progress, EXCLUDED.progress)
                             ELSE EXCLUDED.progress
                           END`;
    } catch {
      const upd = await sql`UPDATE user_lesson_progress
                             SET completed=${completed},
                                 progress=CASE WHEN ${completed}
                                               THEN GREATEST(COALESCE(progress,0), ${progressToSet})
                                               ELSE ${progressToSet}
                                          END
                             WHERE user_id=${userId} AND lesson_id=${lesson.id}`;
      if ((upd as any)?.rowCount === 0) {
        try { await sql`INSERT INTO user_lesson_progress (user_id, lesson_id, progress, completed) VALUES (${userId}, ${lesson.id}, ${progressToSet}, ${completed})`; } catch {}
      }
    }

    // Touch last_viewed; ensure some time if length is known
    if (completed) {
      const lenMin = Number(lesson?.length_min || 0);
      if (lenMin > 0) {
        try { await sql`UPDATE user_lesson_progress SET last_viewed_at=NOW(), time_spent_sec=CASE WHEN COALESCE(time_spent_sec,0)=0 THEN ${lenMin * 60} ELSE time_spent_sec END WHERE user_id=${userId} AND lesson_id=${lesson.id}`; } catch {}
      } else {
        try { await sql`UPDATE user_lesson_progress SET last_viewed_at=NOW() WHERE user_id=${userId} AND lesson_id=${lesson.id}`; } catch {}
      }
    }

    // XP and achievements removed — return minimal payload
    return NextResponse.json({ ok: true, awardedXp: 0 });
  } catch (err: any) {
    console.error('progress POST failed', err);
    return NextResponse.json({ error: 'internal_error', message: String(err?.message || err) }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const isAuthConfigured = Boolean(process.env.NEXTAUTH_SECRET);
    if (!isAuthConfigured) {
      return NextResponse.json({ error: 'auth_not_configured' }, { status: 401 });
    }
    const userId = await requireUserId(req);
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const lr = await sql`SELECT id FROM lessons WHERE slug=${params.slug} LIMIT 1`;
    const lesson = lr.rows[0];
    if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pr = await sql`SELECT progress, completed FROM user_lesson_progress WHERE user_id=${userId} AND lesson_id=${lesson.id} LIMIT 1`;
    const completed = pr.rows.length ? !!pr.rows[0].completed : false;

    const totalR = await sql`SELECT COUNT(*)::int AS total FROM questions WHERE lesson_id=${lesson.id}`;
    const qTotal = Number(totalR.rows[0]?.total || 0);
    const corrR = await sql`SELECT COUNT(*)::int AS cnt FROM user_question_progress WHERE user_id=${userId} AND correct=true AND question_id IN (SELECT id FROM questions WHERE lesson_id=${lesson.id})`;
    const qCorrect = Number(corrR.rows[0]?.cnt || 0);
    const lessonPct = Math.round(((completed ? 1 : 0) + (qTotal > 0 ? qCorrect / qTotal : 0)) / 2 * 100);
    return NextResponse.json({ completed, qTotal, qCorrect, lessonPct });
  } catch (err: any) {
    console.error('progress GET failed', err);
    return NextResponse.json({ error: 'internal_error', message: String(err?.message || err) }, { status: 500 });
  }
}

