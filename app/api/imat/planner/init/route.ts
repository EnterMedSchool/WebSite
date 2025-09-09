import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { imatUserPlan, studyTaskItems, studyTaskLists } from "@/drizzle/schema";
import { and, asc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { IMAT_PLANNER } from "@/lib/imat/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });
  try {
    // If a plan exists already, return it
    const existing = (await db.select().from(imatUserPlan).where(eq(imatUserPlan.userId as any, userId)).limit(1))[0];
    if (existing?.taskListId) {
      const l = (await db.select().from(studyTaskLists).where(and(eq(studyTaskLists.id as any, existing.taskListId as any), eq(studyTaskLists.userId as any, userId))).limit(1))[0];
      if (l) {
        const items = await db.select().from(studyTaskItems).where(eq(studyTaskItems.taskListId as any, l.id)).orderBy(asc(studyTaskItems.position), asc(studyTaskItems.id));
        return NextResponse.json({ data: { plan: existing, list: { ...l, items } } });
      }
    }

    // Create a new global task list for this user's IMAT planner
    const title = "IMAT 8-Week Study Planner";
    const [list] = await db.insert(studyTaskLists).values({ userId, title, isGlobal: true as any, sessionId: null as any }).returning();

    // Insert days as parent items, then day tasks as children
    let pos = 0;
    // Map day number -> parent id for children linking
    const parentIds: number[] = [];
    for (const d of IMAT_PLANNER.days) {
      const [parent] = await db.insert(studyTaskItems).values({
        taskListId: list.id,
        name: `${String(d.day).padStart(2, '0')} • ${d.title}${d.rest ? ' (Rest)' : ''}`,
        isCompleted: false,
        parentItemId: null as any,
        position: pos++,
      }).returning({ id: studyTaskItems.id });
      parentIds[d.day] = Number(parent.id);
      let cpos = 0;
      for (const t of d.tasks) {
        await db.insert(studyTaskItems).values({
          taskListId: list.id,
          name: t,
          isCompleted: false,
          parentItemId: parent.id as any,
          position: cpos++,
        });
      }
    }

    const startDate = new Date();
    const [plan] = await db
      .insert(imatUserPlan)
      .values({ userId, taskListId: list.id as any, startDate: startDate as any, currentDay: 1 as any })
      .returning();

    const items = await db.select().from(studyTaskItems).where(eq(studyTaskItems.taskListId as any, list.id)).orderBy(asc(studyTaskItems.position), asc(studyTaskItems.id));
    return NextResponse.json({ data: { plan, list: { ...list, items } } }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to initialize" }, { status: 500 });
  }
}

