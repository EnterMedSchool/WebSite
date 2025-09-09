import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { studyTaskItems, studyTaskLists } from "@/drizzle/schema";
import { and, asc, eq, max, sql } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
// Removed realtime broadcast dependency for tasks

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Create a single task item under a list
export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const listId = Number(body?.listId);
  const name = String(body?.name || "").trim();
  // session linkage removed for personal tasks
  const parentItemId = body?.parentItemId != null ? Number(body.parentItemId) : null;
  if (!Number.isFinite(listId) || !name) return NextResponse.json({ error: "listId and name are required" }, { status: 400 });

  try {
    // Verify ownership of the list
    const listRows = await db.select().from(studyTaskLists).where(eq(studyTaskLists.id as any, listId)).limit(1);
    const list = listRows[0];
    if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });
    if (list.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Next position under parent
    const posRows = await db
      .select({ m: sql<number>`COALESCE(MAX(position), 0)` })
      .from(studyTaskItems)
      .where(and(eq(studyTaskItems.taskListId as any, listId), eq(studyTaskItems.parentItemId as any, parentItemId as any)));
    const nextPos = Number(posRows[0]?.m ?? 0) + 1;

    await db.insert(studyTaskItems).values({ taskListId: listId, name, isCompleted: false, parentItemId: parentItemId as any, position: nextPos });
    // bump list updated_at
    await db.update(studyTaskLists).set({ updatedAt: new Date() as any }).where(eq(studyTaskLists.id as any, listId));

  const items = await db
      .select()
      .from(studyTaskItems)
      .where(eq(studyTaskItems.taskListId as any, listId))
      .orderBy(asc(studyTaskItems.position), asc(studyTaskItems.id));
    // re-read list for updatedAt
    const l2 = (await db.select().from(studyTaskLists).where(eq(studyTaskLists.id as any, listId)).limit(1))[0];
    const payload = { ...(l2 || list), items } as any;
    return NextResponse.json({ data: payload }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create item' }, { status: 500 });
  }
}
