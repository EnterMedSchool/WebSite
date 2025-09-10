import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { imatUserPlan, imatUserPlanTasks } from "@/drizzle/schema";
import { asc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { IMAT_PLANNER, getDevResources } from "@/lib/imat/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });
  try {
    let up = (await db.select().from(imatUserPlan).where(eq(imatUserPlan.userId as any, userId)).limit(1))[0];
    if (!up) {
      // Create a minimal plan lazily if missing (no tasks yet)
      const [created] = await db
        .insert(imatUserPlan)
        .values({ userId, startDate: new Date() as any, currentDay: 1 as any })
        .returning();
      up = created;
    }

    let tasks = await db
      .select()
      .from(imatUserPlanTasks)
      .where(eq(imatUserPlanTasks.userId as any, userId))
      .orderBy(asc(imatUserPlanTasks.dayNumber), asc(imatUserPlanTasks.taskIndex), asc(imatUserPlanTasks.id));

    if (tasks.length === 0) {
      // Backfill tasks from IMAT_PLANNER if an early empty plan exists
      for (const d of IMAT_PLANNER.days) {
        let idx = 0;
        for (const label of d.tasks) {
          await db.insert(imatUserPlanTasks).values({
            userId,
            dayNumber: d.day as any,
            taskIndex: idx++ as any,
            label,
            isCompleted: false,
          });
        }
      }
      tasks = await db
        .select()
        .from(imatUserPlanTasks)
        .where(eq(imatUserPlanTasks.userId as any, userId))
        .orderBy(asc(imatUserPlanTasks.dayNumber), asc(imatUserPlanTasks.taskIndex), asc(imatUserPlanTasks.id));
    }

    const days = groupTasks(tasks);
    return NextResponse.json({ data: { plan: up, days } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load" }, { status: 500 });
  }
}

function groupTasks(rows: any[]) {
  const byDay: Record<number, { day: number; title: string; rest?: boolean; tasks: any[]; videos?: any[]; lessons?: any[]; chapters?: any[] }> = {} as any;
  for (const r of rows) {
    const dn = Number(r.dayNumber);
    const meta = IMAT_PLANNER.days.find((d) => d.day === dn);
    const dev = getDevResources(dn); if (!byDay[dn]) byDay[dn] = { day: dn, title: meta ? meta.title : `Day ${dn}`, rest: meta?.rest, tasks: [], videos: meta?.videos || dev.videos, lessons: meta?.lessons || dev.lessons, chapters: meta?.chapters || dev.chapters };
    byDay[dn].tasks.push({ id: r.id, label: r.label, isCompleted: r.isCompleted });
  }
  return Object.values(byDay);
}
