import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { studyTaskItems, studyTaskLists } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { publish } from "@/lib/study/pusher";
import { StudyEvents } from "@/lib/study/events";

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
  const title = typeof body?.title === "string" ? String(body.title).trim() : undefined;
  const items: Array<{ name: string; isCompleted?: boolean }> = Array.isArray(body?.items) ? body.items : [];

  try {
    const rows = await db.select().from(studyTaskLists).where(eq(studyTaskLists.id as any, id)).limit(1);
    const list = rows[0];
    if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (list.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (title) {
      await db.update(studyTaskLists).set({ title }).where(eq(studyTaskLists.id as any, id));
    }

    if (Array.isArray(items)) {
      // Simple full replace strategy
      await db.delete(studyTaskItems).where(eq(studyTaskItems.taskListId as any, id));
      if (items.length) {
        await db.insert(studyTaskItems).values(
          items.map((it) => ({ taskListId: id, name: String(it.name || ""), isCompleted: !!it.isCompleted }))
        );
      }
    }

    const newItems = await db.select().from(studyTaskItems).where(eq(studyTaskItems.taskListId as any, id));
    const payload = { ...list, title: title ?? list.title, items: newItems };
    await publish(list.sessionId, StudyEvents.TaskUpsert, payload);
    return NextResponse.json({ data: payload });
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
    await publish(list.sessionId, StudyEvents.TaskDelete, { taskListId: id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete" }, { status: 500 });
  }
}
