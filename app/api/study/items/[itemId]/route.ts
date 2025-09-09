import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { studyTaskItems, studyTaskLists } from "@/drizzle/schema";
import { and, asc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { publish } from "@/lib/study/pusher";
import { StudyEvents } from "@/lib/study/events";
import { levelFromXp, xpToNext, GOAL_XP, MAX_LEVEL } from "@/lib/xp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function broadcastList(listId: number, sessionIdHint?: number) {
  const listRows = await db.select().from(studyTaskLists).where(eq(studyTaskLists.id as any, listId)).limit(1);
  const list = listRows[0];
  if (!list) return;
  const items = await db.select().from(studyTaskItems).where(eq(studyTaskItems.taskListId as any, listId)).orderBy(asc(studyTaskItems.position), asc(studyTaskItems.id));
  const payload = { ...list, items } as any;
  const broadcastId = (list.sessionId ?? (Number.isFinite(sessionIdHint||NaN) ? sessionIdHint! : null)) as number | null;
  if (typeof broadcastId === 'number') await publish(broadcastId, StudyEvents.TaskUpsert, payload);
  return payload;
}

export async function PATCH(req: Request, { params }: { params: { itemId: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized', code: 'NO_SESSION' }, { status: 401 });
  const id = Number(params.itemId);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const body = await req.json().catch(()=>({}));
  const sessionIdBody = Number(body?.sessionId);
  try {
    const rows = await db.select().from(studyTaskItems).where(eq(studyTaskItems.id as any, id)).limit(1);
    const item = rows[0];
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const listRows = await db.select().from(studyTaskLists).where(eq(studyTaskLists.id as any, item.taskListId)).limit(1);
    const list = listRows[0];
    if (!list || list.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updates: any = {};
    if (typeof body?.name === 'string') updates.name = String(body.name);
    if (typeof body?.isCompleted === 'boolean') updates.isCompleted = !!body.isCompleted;
    if (body?.parentItemId !== undefined) updates.parentItemId = (body.parentItemId === null ? null : Number(body.parentItemId)) as any;
    if (typeof body?.position === 'number') updates.position = Number(body.position);

    let xpDelta = 0;
    if (updates.isCompleted === true && item.isCompleted === false && !item.xpAwarded) {
      updates.xpAwarded = true;
      updates.completedAt = new Date() as any;
      xpDelta += 2;
    }

    if (Object.keys(updates).length > 0) {
      await db.update(studyTaskItems).set(updates).where(eq(studyTaskItems.id as any, id));
      await db.update(studyTaskLists).set({ updatedAt: new Date() as any }).where(eq(studyTaskLists.id as any, item.taskListId));
    }

    let progress: any = null;
    if (xpDelta > 0) {
      const ur = await sql`SELECT xp, level FROM users WHERE id=${userId} LIMIT 1`;
      const currXp = Number(ur.rows[0]?.xp || 0);
      const nextXp = currXp + xpDelta;
      const newLevel = levelFromXp(nextXp);
      await sql`UPDATE users SET xp=${nextXp}, level=${newLevel} WHERE id=${userId}`;
      await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                VALUES (${userId}, 'task', ${item.taskListId}, 'xp_awarded', ${JSON.stringify({ amount: xpDelta, totalXp: nextXp })}::jsonb)`;
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

    const payload = await broadcastList(item.taskListId, sessionIdBody);
    return NextResponse.json({ data: payload, xpAwarded: xpDelta, progress });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { itemId: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized', code: 'NO_SESSION' }, { status: 401 });
  const id = Number(params.itemId);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const url = new URL(req.url);
  const sessionIdFromQuery = Number(url.searchParams.get('sessionId'));
  try {
    const rows = await db.select().from(studyTaskItems).where(eq(studyTaskItems.id as any, id)).limit(1);
    const item = rows[0];
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const listRows = await db.select().from(studyTaskLists).where(eq(studyTaskLists.id as any, item.taskListId)).limit(1);
    const list = listRows[0];
    if (!list || list.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Delete item and its subtree (via ON DELETE CASCADE for children pointing to this item as parent)
    await db.delete(studyTaskItems).where(eq(studyTaskItems.id as any, id));
    const payload = await broadcastList(item.taskListId, sessionIdFromQuery);
    return NextResponse.json({ ok: true, data: payload });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete item' }, { status: 500 });
  }
}
