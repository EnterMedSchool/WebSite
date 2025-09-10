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

    await (sql as any).begin(async (tx: any) => {
      // Lock the task row first
      const lock = await tx`SELECT id, user_id, day_number, is_completed, xp_awarded FROM imat_user_plan_tasks WHERE id=${id} AND user_id=${userId} FOR UPDATE`;
      const t = lock.rows[0];
      if (!t) throw new Error('Not found');

      const willAward = checked && t.xp_awarded === false;
      const xpDelta = willAward ? 2 : 0;

      await tx`UPDATE imat_user_plan_tasks
               SET is_completed=${checked},
                   completed_at=CASE WHEN ${checked} THEN NOW() ELSE completed_at END,
                   xp_awarded=CASE WHEN ${willAward} THEN true ELSE xp_awarded END,
                   updated_at=NOW()
               WHERE id=${id}`;

      // If day fully complete now, emit event once and add a small bonus
      const dayNumber = Number(t.day_number);
      let dayBonus = 0;
      if (checked) {
        const agg = await tx`SELECT COUNT(*) AS total, SUM(CASE WHEN is_completed THEN 1 ELSE 0 END) AS done
                              FROM imat_user_plan_tasks WHERE user_id=${userId} AND day_number=${dayNumber}`;
        const total = Number(agg.rows[0]?.total || 0);
        const done = Number(agg.rows[0]?.done || 0);
        if (total > 0 && done === total) {
          const ins = await tx`
            WITH ins AS (
              INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
              SELECT ${userId}, 'imat_day', ${dayNumber}, 'day_completed', '{}'::jsonb
              WHERE NOT EXISTS (
                SELECT 1 FROM lms_events WHERE user_id=${userId} AND subject_type='imat_day' AND subject_id=${dayNumber} AND action='day_completed'
              )
              RETURNING 1
            ) SELECT COUNT(*) AS n FROM ins`;
          const inserted = Number(ins.rows[0]?.n || 0) > 0;
          if (inserted) {
            dayBonus = 5;
            await tx`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                     VALUES (${userId}, 'imat_day', ${dayNumber}, 'xp_awarded', ${JSON.stringify({ amount: 5, subject: 'Day Bonus' })}::jsonb)`;
          }
        }
      }

      const totalDelta = xpDelta + dayBonus;
      if (totalDelta > 0) {
        // Update XP + level atomically
        const cur = await tx`SELECT xp FROM users WHERE id=${userId} FOR UPDATE`;
        const nextXp = Number(cur.rows[0]?.xp || 0) + totalDelta;
        const newLevel = levelFromXp(nextXp);
        await tx`UPDATE users SET xp=${nextXp}, level=${newLevel} WHERE id=${userId}`;
        if (xpDelta > 0) {
          await tx`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                   VALUES (${userId}, 'imat_task', ${id}, 'xp_awarded', ${JSON.stringify({ amount: xpDelta, totalXp: nextXp, subject: 'Planner Task' })}::jsonb)`;
        }
        // Build progress for UI
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
        xpAwardedTotal = totalDelta;
      }
    });

    return NextResponse.json({ ok: true, xpAwarded: xpAwardedTotal, progress });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update task' }, { status: 500 });
  }
}

