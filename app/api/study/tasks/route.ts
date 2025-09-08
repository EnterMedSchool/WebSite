import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { studyTaskLists, studyTaskItems } from "@/drizzle/schema";
import { and, eq, inArray, asc } from "drizzle-orm";
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
    const prs = await sql<{ user_id: number }>`SELECT DISTINCT user_id FROM study_session_participants WHERE session_id = ${sessionId}`;
    const participantIds = prs.rows.map((r:any)=> Number(r.user_id));
    if (participantIds.length === 0) return NextResponse.json({ data: [] });

    const listsRes = await sql<{
      id: number;
      session_id: number;
      user_id: number;
      title: string;
      name: string | null;
      image: string | null;
      username: string | null;
    }>`
      SELECT l.id, l.session_id, l.user_id, l.title, u.name, u.image, u.username
      FROM study_task_lists l
      JOIN users u ON u.id = l.user_id
      WHERE l.user_id = ANY(${participantIds}::int[]) AND (l.is_global = TRUE OR l.session_id = ${sessionId})
    `;
    const lists = listsRes.rows;
    const listIds = lists.map((l) => l.id);
    const items = listIds.length
      ? await db
          .select()
          .from(studyTaskItems)
          .where(inArray(studyTaskItems.taskListId as any, listIds as any))
          .orderBy(asc(studyTaskItems.position), asc(studyTaskItems.id))
      : [];

    const grouped = lists.map((l) => ({
      id: l.id,
      sessionId: l.session_id,
      userId: l.user_id,
      title: l.title,
      user: { id: l.user_id, name: l.name, image: l.image, username: l.username },
      items: items
        .filter((it: any) => it.taskListId === l.id)
        .map((it: any) => ({ id: it.id, taskListId: l.id, name: it.name, isCompleted: it.isCompleted, parentItemId: it.parentItemId ?? null, position: it.position })),
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
    const [list] = await db
      .insert(studyTaskLists)
      .values({ title, sessionId: isGlobal ? (null as any) : (Number.isFinite(sessionId)? sessionId : null) as any, userId, isGlobal })
      .returning({ id: studyTaskLists.id, title: studyTaskLists.title, sessionId: studyTaskLists.sessionId, userId: studyTaskLists.userId, createdAt: studyTaskLists.createdAt, isGlobal: studyTaskLists.isGlobal });

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

    const payload = { ...list, items: items.map((it, i) => ({ id: i, taskListId: list.id, name: it.name, isCompleted: !!it.isCompleted, parentItemId: it.parentItemId ?? null, position: typeof it.position === 'number' ? it.position! : i })) };
    const broadcast = list.sessionId ?? (Number.isFinite(sessionId) ? sessionId : null);
    if (broadcast != null) await publish(broadcast, StudyEvents.TaskUpsert, payload);
    return NextResponse.json({ data: payload }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create" }, { status: 500 });
  }
}
