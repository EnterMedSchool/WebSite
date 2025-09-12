import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { todos, users } from "@/drizzle/schema";
import { and, asc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { rateAllow, clientIpFrom } from "@/lib/rate-limit";
import { levelFromXp, xpToNext, GOAL_XP, MAX_LEVEL } from "@/lib/xp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = `todos:update:${userId}:${clientIpFrom(req)}`;
  if (!rateAllow(key, 60, 60_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  try {
    const row = (await db.select().from(todos).where(eq(todos.id as any, id)).limit(1))[0] as any;
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (Number(row.userId) !== Number(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updates: any = {};
    if (typeof body?.label === 'string') updates.label = String(body.label).slice(0, 400);
    if (typeof body?.done === 'boolean') updates.done = !!body.done;
    if (typeof body?.position === 'number') updates.position = Number(body.position);

    let xpDelta = 0;
    const BASE_TODO_XP = 2;
    const DAILY_TODO_XP_CAP = 200; // max XP from todos per day
    if (updates.done === true && row.done === false && !row.xpAwarded) {
      // We will set xpAwarded only if some XP is actually granted (see cap below)
      xpDelta = BASE_TODO_XP;
    }
    if (Object.keys(updates).length > 0) {
      await db.update(todos).set(updates).where(eq(todos.id as any, id));
    }

    let progress: any = null;
    if (xpDelta > 0) {
      // Check today's awarded XP for todos and apply cap
      let todayAwarded = 0;
      try {
        const sr = await sql`SELECT COALESCE(SUM((payload->>'amount')::int),0) AS sum
                             FROM lms_events
                             WHERE user_id=${userId}
                               AND action='xp_awarded'
                               AND subject_type='todo'
                               AND created_at >= date_trunc('day', now())`;
        todayAwarded = Number(sr.rows?.[0]?.sum || 0);
      } catch {}
      const remaining = Math.max(0, DAILY_TODO_XP_CAP - todayAwarded);
      const grant = Math.max(0, Math.min(xpDelta, remaining));

      if (grant > 0) {
        // Persist completion + XP awarded flag only when actually granting XP
        updates.xpAwarded = true;
        updates.completedAt = new Date() as any;

        const ur = await sql`SELECT xp, level FROM users WHERE id=${userId} LIMIT 1`;
        const currXp = Number(ur.rows?.[0]?.xp || 0);
        const nextXp = currXp + grant;
        const newLevel = levelFromXp(nextXp);
        await sql`UPDATE users SET xp=${nextXp}, level=${newLevel} WHERE id=${userId}`;
        await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                  VALUES (${userId}, 'todo', ${id}, 'xp_awarded', ${JSON.stringify({ amount: grant, totalXp: nextXp })}::jsonb)`;

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
        xpDelta = grant; // report actual granted amount
      } else {
        // Cap reached: do not mark xpAwarded; allow future days to grant XP if unchecked/checked again
        xpDelta = 0;
      }
    }

    const fresh = (await db.select().from(todos).where(eq(todos.id as any, id)).limit(1))[0];
    return NextResponse.json({ data: fresh, xpAwarded: xpDelta, progress });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const row = (await db.select().from(todos).where(eq(todos.id as any, id)).limit(1))[0] as any;
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (Number(row.userId) !== Number(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await db.delete(todos).where(eq(todos.id as any, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
