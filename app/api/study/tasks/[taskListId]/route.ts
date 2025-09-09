import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { studyTaskItems, studyTaskLists } from "@/drizzle/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { publish } from "@/lib/study/pusher";
import { StudyEvents } from "@/lib/study/events";
import { levelFromXp, GOAL_XP, xpToNext, MAX_LEVEL } from "@/lib/xp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Update list (title and/or items by full replace)
export async function PATCH(
  req: Request,
  { params }: { params: { taskListId: string } }
) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });
  const id = Number(params.taskListId);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const sessionIdFromBody = Number((body as any)?.sessionId);
  const title = typeof body?.title === "string" ? String(body.title).trim() : undefined;
  const items: Array<{ id?: number; name: string; isCompleted?: boolean; parentItemId?: number | null; position?: number }> = Array.isArray(body?.items) ? body.items : [];

  try {
    const rows = await db.select().from(studyTaskLists).where(eq(studyTaskLists.id as any, id)).limit(1);
    const list = rows[0];
    if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (list.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (title) await db.update(studyTaskLists).set({ title, updatedAt: new Date() as any }).where(eq(studyTaskLists.id as any, id));

    // Fetch existing items to diff for XP and updates
    const existing = await db
      .select()
      .from(studyTaskItems)
      .where(eq(studyTaskItems.taskListId as any, id))
      .orderBy(asc(studyTaskItems.position), asc(studyTaskItems.id));

    const existingMap = new Map<number, any>();
    existing.forEach((it: any) => existingMap.set(it.id, it));

    const incomingIds = new Set<number>();
    let positionCounter = 0;
    let xpDelta = 0;

    for (const it of items) {
      const pos = typeof it.position === 'number' ? it.position! : positionCounter++;
      if (it.id && existingMap.has(it.id)) {
        const prev = existingMap.get(it.id);
        const becameCompleted = !prev.isCompleted && !!it.isCompleted;
        const updates: any = {
          name: String(it.name || prev.name || ''),
          isCompleted: !!it.isCompleted,
          parentItemId: (it.parentItemId ?? null) as any,
          position: pos,
        };
        if (becameCompleted && !prev.xpAwarded) {
          updates.xpAwarded = true;
          updates.completedAt = new Date() as any;
          xpDelta += 2;
        }
        await db.update(studyTaskItems).set(updates).where(eq(studyTaskItems.id as any, it.id));
        incomingIds.add(it.id);
      } else {
        const ins = await db.insert(studyTaskItems).values({
          taskListId: id,
          name: String(it.name || ''),
          isCompleted: !!it.isCompleted,
          parentItemId: (it.parentItemId ?? null) as any,
          position: pos,
          completedAt: it.isCompleted ? (new Date() as any) : undefined,
          xpAwarded: !!it.isCompleted,
        }).returning({ id: studyTaskItems.id });
        if (it.isCompleted) xpDelta += 2;
        incomingIds.add(ins[0].id as any);
      }
    }

    // Delete items removed in incoming (including their subtrees)
    const toDelete = existing.filter((e: any) => !incomingIds.has(e.id));
    if (toDelete.length) {
      await db.delete(studyTaskItems).where(inArray(studyTaskItems.id as any, toDelete.map((x: any) => x.id) as any));
    }
    await db.update(studyTaskLists).set({ updatedAt: new Date() as any }).where(eq(studyTaskLists.id as any, id));

    // Award XP if needed
    let progress: any = null;
    if (xpDelta > 0) {
      const ur = await sql`SELECT xp, level FROM users WHERE id=${userId} LIMIT 1`;
      const currXp = Number(ur.rows[0]?.xp || 0);
      const nextXp = currXp + xpDelta;
      const newLevel = levelFromXp(nextXp);
      await sql`UPDATE users SET xp=${nextXp}, level=${newLevel} WHERE id=${userId}`;
      await sql`INSERT INTO lms_events (user_id, subject_type, subject_id, action, payload)
                VALUES (${userId}, 'task', ${id}, 'xp_awarded', ${JSON.stringify({ amount: xpDelta, totalXp: nextXp })}::jsonb)`;
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

    const newItems = await db.select().from(studyTaskItems).where(eq(studyTaskItems.taskListId as any, id)).orderBy(asc(studyTaskItems.position), asc(studyTaskItems.id));
    const refreshedList = (await db.select().from(studyTaskLists).where(eq(studyTaskLists.id as any, id)).limit(1))[0];
    const payload = { ...(refreshedList || list), title: title ?? list.title, items: newItems } as any;
    const broadcastId = (list.sessionId ?? (Number.isFinite(sessionIdFromBody) ? sessionIdFromBody : null)) as number | null;
    if (typeof broadcastId === 'number') {
      await publish(broadcastId, StudyEvents.TaskUpsert, payload);
    }
    return NextResponse.json({ data: payload, xpAwarded: xpDelta, progress });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { taskListId: string } }
) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });
  const id = Number(params.taskListId);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const rows = await db.select().from(studyTaskLists).where(eq(studyTaskLists.id as any, id)).limit(1);
    const list = rows[0];
    if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (list.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await db.delete(studyTaskItems).where(eq(studyTaskItems.taskListId as any, id));
    await db.delete(studyTaskLists).where(eq(studyTaskLists.id as any, id));
    const url = new URL(req.url);
    const sessionIdFromQuery = Number(url.searchParams.get('sessionId'));
    const broadcastId = (list.sessionId ?? (Number.isFinite(sessionIdFromQuery) ? sessionIdFromQuery : null)) as number | null;
    if (typeof broadcastId === 'number') {
      await publish(broadcastId, StudyEvents.TaskDelete, { taskListId: id });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete" }, { status: 500 });
  }
}
