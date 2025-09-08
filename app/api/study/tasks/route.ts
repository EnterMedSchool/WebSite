import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { studyTaskLists, studyTaskItems } from "@/drizzle/schema";
import { and, eq, inArray } from "drizzle-orm";
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
      WHERE l.session_id = ${sessionId}
    `;
    const lists = listsRes.rows;
    const listIds = lists.map((l) => l.id);
    const items = listIds.length
      ? await db
          .select()
          .from(studyTaskItems)
          .where(inArray(studyTaskItems.taskListId as any, listIds as any))
      : [];

    const grouped = lists.map((l) => ({
      id: l.id,
      sessionId: l.session_id,
      userId: l.user_id,
      title: l.title,
      user: { id: l.user_id, name: l.name, image: l.image, username: l.username },
      items: items
        .filter((it: any) => it.taskListId === l.id)
        .map((it: any) => ({ id: it.id, taskListId: l.id, name: it.name, isCompleted: it.isCompleted })),
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
  const items: Array<{ name: string; isCompleted?: boolean }> = Array.isArray(body?.items) ? body.items : [];
  if (!Number.isFinite(sessionId)) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });

  try {
    const [list] = await db
      .insert(studyTaskLists)
      .values({ title, sessionId, userId })
      .returning({ id: studyTaskLists.id, title: studyTaskLists.title, sessionId: studyTaskLists.sessionId, userId: studyTaskLists.userId, createdAt: studyTaskLists.createdAt });

    if (items.length) {
      await db.insert(studyTaskItems).values(
        items.map((it) => ({ taskListId: list.id, name: String(it.name || ""), isCompleted: !!it.isCompleted }))
      );
    }

    const payload = { ...list, items: items.map((it, i) => ({ id: i, taskListId: list.id, name: it.name, isCompleted: !!it.isCompleted })) };
    await publish(sessionId, StudyEvents.TaskUpsert, payload);
    return NextResponse.json({ data: payload }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create" }, { status: 500 });
  }
}
