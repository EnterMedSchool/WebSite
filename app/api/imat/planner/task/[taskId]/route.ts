import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { imatUserPlanTasks } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
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
  try {
    const rows = await db.select().from(imatUserPlanTasks).where(eq(imatUserPlanTasks.id as any, id)).limit(1);
    const task = rows[0];
    if (!task || Number(task.userId) !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updates: any = {};
    if (typeof body?.isCompleted === 'boolean') updates.isCompleted = !!body.isCompleted;

    let xpDelta = 0;
    if (updates.isCompleted === true && task.isCompleted === false && !task.xpAwarded) {
      updates.xpAwarded = true;
      updates.completedAt = new Date() as any;
      xpDelta += 2; // Award 2 XP per planner task completion
    }

    if (Object.keys(updates).length > 0) {
      await db.update(imatUserPlanTasks).set(updates).where(eq(imatUserPlanTasks.id as any, id));
    }

    let progress: any = null;
    if (xpDelta > 0) {
      const ur = await sql`SELECT xp, level FROM users WHERE id=${userId} LIMIT 1`;
      const currXp = Number(ur.rows[0]?.xp || 0);
      const nextXp = currXp + xpDelta;
      const newLevel = levelFromXp(nextXp);
      await sql`UPDATE users SET xp=${nextXp}, level=${newLevel} WHERE id=${userId}`;
      await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                VALUES (${userId}, 'imat_task', ${id}, 'xp_awarded', ${JSON.stringify({ amount: xpDelta, totalXp: nextXp, subject: 'Planner Task' })}::jsonb)`;
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

    return NextResponse.json({ ok: true, xpAwarded: xpDelta, progress });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update task' }, { status: 500 });
  }
}

