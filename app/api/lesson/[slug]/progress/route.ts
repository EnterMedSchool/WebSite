import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { levelFromXp, MAX_LEVEL, GOAL_XP } from "@/lib/xp";

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
    const progress = hasProgress ? Math.max(0, Math.min(100, Number(body.progress))) : 0;
    const hasCompleted = Object.prototype.hasOwnProperty.call(body, "completed");
    // Resolve user id from session (fallback to lookup by email)
    const session = await getServerSession(authOptions as any);
    let userId = session && (session as any).userId ? Number((session as any).userId) : 0;
    // Guard against provider subject ids sneaking in (Google sub is a 21-digit string)
    if (!Number.isSafeInteger(userId) || userId <= 0 || userId > 2147483647) {
      userId = 0;
    }
    if (!userId && (session as any)?.user?.email) {
      const email = String((session as any).user.email).toLowerCase();
      const ur = await sql`SELECT id FROM users WHERE email=${email} LIMIT 1`;
      if (ur.rows[0]?.id) userId = Number(ur.rows[0].id);
    }
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const lr = await sql`SELECT id FROM lessons WHERE slug=${params.slug} LIMIT 1`;
    const lesson = lr.rows[0];
    if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // If caller didn't explicitly set completed, preserve existing state
    let completed: boolean;
    if (hasCompleted) {
      completed = !!(body as any).completed;
    } else {
      const existing = await sql`SELECT completed FROM user_lesson_progress WHERE user_id=${userId} AND lesson_id=${lesson.id} LIMIT 1`;
      completed = existing.rows.length ? !!existing.rows[0].completed : progress === 100;
    }

    // Insert or update. On conflict, only update 'completed' to avoid clobbering progress/last_viewed_at when toggling.
    await sql`INSERT INTO user_lesson_progress (user_id, lesson_id, progress, completed)
              VALUES (${userId}, ${lesson.id}, ${progress}, ${completed})
              ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed=${completed}`;

    // Award XP once on first completion
    let awardedXp = 0;
    let newXp = null as null | number;
    let newLevel = null as null | number;
    if (completed) {
      // Award XP only once per lesson per user based on xp_awarded marker
      const awarded = await sql`SELECT 1 FROM lms_events WHERE user_id=${userId} AND subject_type='lesson' AND subject_id=${lesson.id} AND action='xp_awarded' LIMIT 1`;
      if (awarded.rows.length === 0) {
        // Record completion event (idempotent due to unique index)
        try {
          await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                    VALUES (${userId}, 'lesson', ${lesson.id}, 'completed', ${JSON.stringify({ progress })}::jsonb)`;
        } catch {}

        // Load current XP/level, award 10 XP, compute new level
        const ur = await sql`SELECT xp, level FROM users WHERE id=${userId} LIMIT 1`;
        const currXp = Number(ur.rows[0]?.xp || 0);
        const currLevel = Number(ur.rows[0]?.level || 1);
        const add = 10;
        const nextXp = currXp + add;
        const newLevel = levelFromXp(nextXp);
        await sql`UPDATE users SET xp=${nextXp}, level=${newLevel} WHERE id=${userId}`;
        awardedXp = add; newXp = nextXp;
        // Optional: log level up event
        if (newLevel > currLevel && newLevel <= MAX_LEVEL) {
          try {
            await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                      VALUES (${userId}, 'user', ${userId}, 'level_up', ${JSON.stringify({ from: currLevel, to: newLevel, xp: nextXp })}::jsonb)`;
          } catch {}
        }
        // Optional: separate xp_awarded event for auditing
        try {
          await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                    VALUES (${userId}, 'lesson', ${lesson.id}, 'xp_awarded', ${JSON.stringify({ amount: add, totalXp: nextXp })}::jsonb)`;
        } catch {}
      }
    }
    if (newXp == null) {
      const ur2 = await sql`SELECT xp, level FROM users WHERE id=${userId} LIMIT 1`;
      newXp = Number(ur2.rows[0]?.xp || 0);
      newLevel = Number(ur2.rows[0]?.level || 1);
    } else {
      // we already set newLevel above
      const ur2 = await sql`SELECT level FROM users WHERE id=${userId} LIMIT 1`;
      newLevel = Number(ur2.rows[0]?.level || newLevel || 1);
    }
    const lvl = Math.min(Math.max(Number(newLevel || 1), 1), MAX_LEVEL);
    const start = GOAL_XP[lvl - 1] ?? 0;
    const nextGoal = GOAL_XP[Math.min(GOAL_XP.length - 1, lvl)] ?? start + 1;
    const span = Math.max(1, nextGoal - start);
    const inLevel = Math.max(0, Math.min(span, Number(newXp || 0) - start));
    const pct = Math.round((inLevel / span) * 100);
    return NextResponse.json({ ok: true, awardedXp, newXp, newLevel: lvl, inLevel, span, pct });
  } catch (err: any) {
    console.error('progress POST failed', err);
    return NextResponse.json({ error: 'internal_error', message: String(err?.message || err) }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const isAuthConfigured = Boolean(process.env.NEXTAUTH_SECRET);
    if (!isAuthConfigured) {
      return NextResponse.json({ error: 'auth_not_configured' }, { status: 401 });
    }
    const session = await getServerSession(authOptions as any);
    let userId = session && (session as any).userId ? Number((session as any).userId) : 0;
    if (!Number.isSafeInteger(userId) || userId <= 0 || userId > 2147483647) {
      userId = 0;
    }
    if (!userId && (session as any)?.user?.email) {
      const email = String((session as any).user.email).toLowerCase();
      const ur = await sql`SELECT id FROM users WHERE email=${email} LIMIT 1`;
      if (ur.rows[0]?.id) userId = Number(ur.rows[0].id);
    }
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const lr = await sql`SELECT id FROM lessons WHERE slug=${params.slug} LIMIT 1`;
    const lesson = lr.rows[0];
    if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const pr = await sql`SELECT progress, completed FROM user_lesson_progress WHERE user_id=${userId} AND lesson_id=${lesson.id} LIMIT 1`;
    if (pr.rows.length === 0) return NextResponse.json({ progress: 0, completed: false });
    const row = pr.rows[0];
    return NextResponse.json({ progress: Number(row.progress || 0), completed: !!row.completed });
  } catch (err: any) {
    console.error('progress GET failed', err);
    return NextResponse.json({ error: 'internal_error', message: String(err?.message || err) }, { status: 500 });
  }
}
