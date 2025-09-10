import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireUserId } from "@/lib/study/auth";
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
    const progressInput = hasProgress ? Math.max(0, Math.min(100, Number(body.progress))) : null;
    const hasCompleted = Object.prototype.hasOwnProperty.call(body, "completed");
    // Resolve user id (supports mobile Bearer token and web cookies)
    const userId = await requireUserId(req);
    if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const lr = await sql`SELECT id, length_min FROM lessons WHERE slug=${params.slug} LIMIT 1`;
    const lesson = lr.rows[0];
    if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // If caller didn't explicitly set completed, preserve existing state
    let completed: boolean;
    if (hasCompleted) {
      completed = !!(body as any).completed;
    } else {
      const existing = await sql`SELECT completed FROM user_lesson_progress WHERE user_id=${userId} AND lesson_id=${lesson.id} LIMIT 1`;
      completed = existing.rows.length ? !!existing.rows[0].completed : (progressInput === 100);
    }

    // Compute progress to persist: completion implies 100%
    const progressToSet = completed ? 100 : Number(progressInput ?? 0);

    // Insert or update. Some environments may not yet have the unique constraint; fall back gracefully.
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
      // Manual upsert: try update first; if rowcount 0, insert
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

    // If just completed, ensure last_viewed_at set and minimal time accounted
    if (completed) {
      const lenMin = Number(lesson?.length_min || 0);
      if (lenMin > 0) {
        try { await sql`UPDATE user_lesson_progress SET last_viewed_at=NOW(), time_spent_sec=CASE WHEN COALESCE(time_spent_sec,0)=0 THEN ${lenMin * 60} ELSE time_spent_sec END WHERE user_id=${userId} AND lesson_id=${lesson.id}`; } catch {}
      } else {
        try { await sql`UPDATE user_lesson_progress SET last_viewed_at=NOW() WHERE user_id=${userId} AND lesson_id=${lesson.id}`; } catch {}
      }
    }

    // Award XP once on first completion
    let awardedXp = 0;
    let newXp = null as null | number;
    let newLevel = null as null | number;
    const rewards: any[] = [];
    if (completed) {
      // Award XP only once per lesson per user based on xp_awarded marker
      const awarded = await sql`SELECT 1 FROM lms_events WHERE user_id=${userId} AND subject_type='lesson' AND subject_id=${lesson.id} AND action='xp_awarded' LIMIT 1`;
      if (awarded.rows.length === 0) {
        // Record completion event (idempotent due to unique index)
        try {
          await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                    VALUES (${userId}, 'lesson', ${lesson.id}, 'completed', ${JSON.stringify({ progress: 100 })}::jsonb)`;
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
        // Milestone: total completed lessons
        try {
          const cntR = await sql`SELECT COUNT(*)::int AS completed FROM user_lesson_progress WHERE user_id=${userId} AND completed=true`;
          const totalCompleted = Number(cntR.rows[0]?.completed || 0);
          const milestones = [3, 5, 10, 20, 50];
          for (const m of milestones) {
            if (totalCompleted === m) {
              const key = `lessons_${m}`;
              const exists = await sql`SELECT 1 FROM lms_events WHERE user_id=${userId} AND action='reward' AND (payload->>'key')=${key} LIMIT 1`;
              if (exists.rows.length === 0) {
                try { await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                                 VALUES (${userId}, 'user', ${userId}, 'reward', ${JSON.stringify({ type: 'badge', key, label: `${m} Lessons Completed` })}::jsonb)`; } catch {}
                rewards.push({ type: 'badge', key, label: `${m} Lessons Completed` });
              }
            }
          }
        } catch {}

        // Milestone: chapter completion chest(s) for any chapters that include this lesson
        try {
          const cr = await sql`SELECT cl.chapter_id, c.title, c.position
                               FROM chapter_lessons cl JOIN chapters c ON c.id=cl.chapter_id
                               WHERE cl.lesson_id=${lesson.id}`;
          for (const ch of cr.rows) {
            const chId = Number(ch.chapter_id);
            const doneR = await sql`SELECT COUNT(*)::int AS completed FROM user_lesson_progress WHERE user_id=${userId} AND completed=true AND lesson_id IN (SELECT lesson_id FROM chapter_lessons WHERE chapter_id=${chId})`;
            const totR = await sql`SELECT COUNT(*)::int AS total FROM chapter_lessons WHERE chapter_id=${chId}`;
            const d = Number(doneR.rows[0]?.completed || 0);
            const t = Number(totR.rows[0]?.total || 0);
            if (t > 0 && d === t) {
              const key = `chapter_${chId}`;
              const exists = await sql`SELECT 1 FROM lms_events WHERE user_id=${userId} AND action='reward' AND (payload->>'key')=${key} LIMIT 1`;
              if (exists.rows.length === 0) {
                try { await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                                 VALUES (${userId}, 'chapter', ${chId}, 'reward', ${JSON.stringify({ type: 'chest', key, label: `Chapter ${Number(ch.position || 0)} Complete` })}::jsonb)`; } catch {}
                rewards.push({ type: 'chest', key, label: `Chapter ${Number(ch.position || 0)} Complete` });
              }
            }
          }
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
    return NextResponse.json({ ok: true, awardedXp, newXp, newLevel: lvl, inLevel, span, pct, rewards });
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

    // Completion and question progress
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
