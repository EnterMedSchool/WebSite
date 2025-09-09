import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { studyTaskLists, studyTaskItems, studySessionParticipants, users } from "@/drizzle/schema";
import { and, eq, inArray, asc, or } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { publish } from "@/lib/study/pusher";
import { StudyEvents } from "@/lib/study/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// List all task lists (with items) for a session
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = Number(url.searchParams.get("sessionId"));
  if (!Number.isFinite(sessionId)) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  try {
    // Participants in this session
    const pRows = await db
      .select({ userId: studySessionParticipants.userId })
      .from(studySessionParticipants)
      .where(eq(studySessionParticipants.sessionId as any, sessionId));
    const participantIds = pRows.map((r: any) => Number(r.userId));
    if (participantIds.length === 0) return NextResponse.json({ data: [] });

    const lists = await db
      .select({
        id: studyTaskLists.id,
        sessionId: studyTaskLists.sessionId,
        userId: studyTaskLists.userId,
        title: studyTaskLists.title,
        updatedAt: studyTaskLists.updatedAt,
        name: users.name,
        image: users.image,
        username: users.username,
      })
      .from(studyTaskLists)
      .innerJoin(users, eq(users.id as any, studyTaskLists.userId as any))
      .where(
        and(
          inArray(studyTaskLists.userId as any, participantIds as any),
          or(eq(studyTaskLists.isGlobal as any, true), eq(studyTaskLists.sessionId as any, sessionId))
        )
      );
    const listIds = lists.map((l) => l.id);
    const items = listIds.length
      ? await db
          .select()
          .from(studyTaskItems)
          .where(inArray(studyTaskItems.taskListId as any, listIds as any))
          .orderBy(asc(studyTaskItems.position), asc(studyTaskItems.id))
      : [];

    const grouped = lists.map((l: any) => ({
      id: l.id,
      sessionId: l.sessionId,
      userId: l.userId,
      title: l.title,
      user: { id: l.userId, name: l.name, image: l.image, username: l.username },
      items: items
        .filter((it: any) => it.taskListId === l.id)
        .map((it: any) => ({ id: it.id, taskListId: l.id, name: it.name, isCompleted: it.isCompleted, parentItemId: it.parentItemId ?? null, position: it.position, xpAwarded: it.xpAwarded })),
      updatedAt: l.updatedAt,
    }));
    return NextResponse.json({ data: grouped });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load" }, { status: 500 });
  }
}

// Create a new task list for the current user (optionally with items)
export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const title = (body?.title || "").toString().trim() || "Untitled";
  const sessionId = Number(body?.sessionId);
  const isGlobal: boolean = body?.isGlobal !== false; // default: global list
  const items: Array<{ name: string; isCompleted?: boolean; parentItemId?: number | null; position?: number }> = Array.isArray(body?.items) ? body.items : [];

  try {
    // Enforce single global list per user: if requesting global, return existing
    if (isGlobal) {
      const existing = (await db
        .select({ id: studyTaskLists.id, title: studyTaskLists.title, userId: studyTaskLists.userId, sessionId: studyTaskLists.sessionId })
        .from(studyTaskLists)
        .where(and(eq(studyTaskLists.userId as any, userId), eq(studyTaskLists.isGlobal as any, true)))
        .limit(1))[0];
      if (existing?.id) {
        const existingItems = await db
          .select()
          .from(studyTaskItems)
          .where(eq(studyTaskItems.taskListId as any, existing.id))
          .orderBy(asc(studyTaskItems.position), asc(studyTaskItems.id));
        const payload = {
          id: existing.id,
          sessionId: existing.sessionId,
          userId: existing.userId,
          title: existing.title,
          items: existingItems.map((it: any) => ({ id: it.id, taskListId: existing.id, name: it.name, isCompleted: it.isCompleted, parentItemId: it.parentItemId ?? null, position: it.position })),
        };
        const broadcast = Number.isFinite(sessionId) ? (sessionId as number) : null;
        if (broadcast != null) await publish(broadcast, StudyEvents.TaskUpsert, payload);
        return NextResponse.json({ data: payload });
      }
    }

    const [list] = await db
      .insert(studyTaskLists)
      .values({ title, sessionId: isGlobal ? (null as any) : (Number.isFinite(sessionId)? sessionId : null) as any, userId, isGlobal })
      .returning({ id: studyTaskLists.id, title: studyTaskLists.title, sessionId: studyTaskLists.sessionId, userId: studyTaskLists.userId, createdAt: studyTaskLists.createdAt, isGlobal: studyTaskLists.isGlobal, updatedAt: studyTaskLists.updatedAt });

    if (items.length) {
      let pos = 0;
      await db.insert(studyTaskItems).values(
        items.map((it) => ({
          taskListId: list.id,
          name: String(it.name || ""),
          isCompleted: !!it.isCompleted,
          parentItemId: (it.parentItemId ?? null) as any,
          position: typeof it.position === 'number' ? it.position! : pos++,
        }))
      );
    }

    const payload = { ...list, items: items.map((it, i) => ({ id: i, taskListId: list.id, name: it.name, isCompleted: !!it.isCompleted, parentItemId: it.parentItemId ?? null, position: typeof it.position === 'number' ? it.position! : i })), updatedAt: list.updatedAt };
    const broadcast = list.sessionId ?? (Number.isFinite(sessionId) ? sessionId : null);
    if (broadcast != null) await publish(broadcast, StudyEvents.TaskUpsert, payload);
    return NextResponse.json({ data: payload }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create" }, { status: 500 });
  }
}
