import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { todos, users } from "@/drizzle/schema";
import { and, asc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { levelFromXp, xpToNext, GOAL_XP, MAX_LEVEL } from "@/lib/xp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    if (updates.done === true && row.done === false && !row.xpAwarded) {
      updates.xpAwarded = true;
      updates.completedAt = new Date() as any;
      xpDelta += 2;
    }
    if (Object.keys(updates).length > 0) {
      await db.update(todos).set(updates).where(eq(todos.id as any, id));
    }

    let progress: any = null;
    if (xpDelta > 0) {
      const ur = await sql`SELECT xp, level FROM users WHERE id=${userId} LIMIT 1`;
      const currXp = Number(ur.rows?.[0]?.xp || 0);
      const nextXp = currXp + xpDelta;
      const newLevel = levelFromXp(nextXp);
      await sql`UPDATE users SET xp=${nextXp}, level=${newLevel} WHERE id=${userId}`;
      await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                VALUES (${userId}, 'todo', ${id}, 'xp_awarded', ${JSON.stringify({ amount: xpDelta, totalXp: nextXp })}::jsonb)`;
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

