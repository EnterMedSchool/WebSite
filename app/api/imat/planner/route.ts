import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { imatUserPlan, studyTaskItems, studyTaskLists } from "@/drizzle/schema";
import { and, asc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });
  try {
    const up = (await db.select().from(imatUserPlan).where(eq(imatUserPlan.userId as any, userId)).limit(1))[0];
    if (!up) return NextResponse.json({ data: null });

    let list: any = null;
    if (up.taskListId) {
      const l = (await db.select().from(studyTaskLists).where(and(eq(studyTaskLists.id as any, up.taskListId as any), eq(studyTaskLists.userId as any, userId))).limit(1))[0];
      if (l) {
        const items = await db.select().from(studyTaskItems).where(eq(studyTaskItems.taskListId as any, l.id)).orderBy(asc(studyTaskItems.position), asc(studyTaskItems.id));
        list = { ...l, items };
      }
    }
    return NextResponse.json({ data: { plan: up, list } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load" }, { status: 500 });
  }
}

