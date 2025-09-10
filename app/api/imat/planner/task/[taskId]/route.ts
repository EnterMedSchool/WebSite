import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireUserId } from "@/lib/study/auth";
import { levelFromXp, xpToNext, GOAL_XP, MAX_LEVEL } from "@/lib/xp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { taskId: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized', code: 'NO_SESSION' }, { status: 401 });
  const id = Number(params.taskId);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const checked: boolean = !!body?.isCompleted;

  try {
    let xpAwardedTotal = 0;
    let progress: any = null;

    // 1) Update completion and timestamps
    await sql`UPDATE imat_user_plan_tasks
              SET is_completed=${checked},
                  completed_at=CASE WHEN ${checked} THEN COALESCE(completed_at, NOW()) ELSE completed_at END,
                  updated_at=NOW()
              WHERE id=${id} AND user_id=${userId}`;

    // 2) Award per-task XP once (idempotent)
    let dayNumber: number | null = null;
    if (checked) {
      const aw = await sql`UPDATE imat_user_plan_tasks
                           SET xp_awarded=true, updated_at=NOW()
                           WHERE id=${id} AND user_id=${userId} AND xp_awarded=false
                           RETURNING day_number`;
      if (aw.rowCount && aw.rows[0]?.day_number != null) {
        xpAwardedTotal += 2;
        dayNumber = Number(aw.rows[0].day_number);
      }
    }
    if (dayNumber == null) {
      const r = await sql`SELECT day_number FROM imat_user_plan_tasks WHERE id=${id} AND user_id=${userId} LIMIT 1`;
      if (r.rowCount) dayNumber = Number(r.rows[0].day_number);
    }

    // 3) Attempt day-complete event + bonus guarded by unique index
    let dayBonus = 0;
    if (checked && dayNumber != null) {
      const insDay = await sql`
        WITH d AS (SELECT ${dayNumber}::int AS dn)
        INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
        SELECT ${userId}, 'imat_day', d.dn, 'day_completed', '{}'::jsonb FROM d
        WHERE NOT EXISTS (
          SELECT 1 FROM imat_user_plan_tasks t WHERE t.user_id=${userId} AND t.day_number=d.dn AND t.is_completed=false
        )
        ON CONFLICT (user_id, subject_type, subject_id) WHERE action='day_completed' DO NOTHING
        RETURNING subject_id`;
      if (insDay.rowCount) {
        dayBonus = 5;
        await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                  VALUES (${userId}, 'imat_day', ${dayNumber}, 'xp_awarded', ${JSON.stringify({ amount: 5, subject: 'Day Bonus' })}::jsonb)`;
      }
    }

    const totalDelta = xpAwardedTotal + dayBonus;
    if (totalDelta > 0) {
      const cur = await sql`SELECT xp FROM users WHERE id=${userId} LIMIT 1`;
      const nextXp = Number(cur.rows[0]?.xp || 0) + totalDelta;
      const newLevel = levelFromXp(nextXp);
      await sql`UPDATE users SET xp=${nextXp}, level=${newLevel} WHERE id=${userId}`;
      if (xpAwardedTotal > 0) {
        await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                  VALUES (${userId}, 'imat_task', ${id}, 'xp_awarded', ${JSON.stringify({ amount: xpAwardedTotal, totalXp: nextXp, subject: 'Planner Task' })}::jsonb)`;
      }
      if (newLevel >= MAX_LEVEL) {
        progress = { level: MAX_LEVEL, pct: 100, inLevel: 0, span: 1 };
      } else {
        const start = GOAL_XP[newLevel - 1];
        const { toNext, nextLevelGoal } = xpToNext(nextXp);
        const span = Math.max(1, nextLevelGoal - start);
        const inLevel = Math.max(0, Math.min(span, span - toNext));
        const pct = Math.round((inLevel / span) * 100);
        progress = { level: newLevel, pct, inLevel, span };
      }
    }

    return NextResponse.json({ ok: true, xpAwarded: totalDelta || 0, progress });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update task' }, { status: 500 });
  }
}
