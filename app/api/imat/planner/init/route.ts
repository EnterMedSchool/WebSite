import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { imatUserPlan, imatUserPlanTasks, imatTaskTemplates } from "@/drizzle/schema";
import { and, asc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { IMAT_PLANNER, getDevResources } from "@/lib/imat/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });
  try {
    // If a plan exists already, return it with tasks grouped by day
    const existing = (await db.select().from(imatUserPlan).where(eq(imatUserPlan.userId as any, userId)).limit(1))[0];
    if (existing) {
      let tasks = await db
        .select()
        .from(imatUserPlanTasks)
        .where(eq(imatUserPlanTasks.userId as any, userId))
        .orderBy(asc(imatUserPlanTasks.dayNumber), asc(imatUserPlanTasks.taskIndex), asc(imatUserPlanTasks.id));
      if (tasks.length === 0) {
        for (const d of IMAT_PLANNER.days) {
          let idx = 0;
          for (const label of d.tasks) {
            const tpl = await db
              .select({ id: imatTaskTemplates.id })
              .from(imatTaskTemplates)
              .where(and(eq(imatTaskTemplates.dayNumber as any, d.day as any), eq(imatTaskTemplates.taskIndex as any, idx as any)))
              .limit(1);
            let templateId: number;
            if (tpl[0]?.id) templateId = Number(tpl[0].id);
            else {
              const ins = await db.insert(imatTaskTemplates).values({ dayNumber: d.day as any, taskIndex: idx as any, label }).returning({ id: imatTaskTemplates.id });
              templateId = Number(ins[0].id);
            }
            await db.insert(imatUserPlanTasks).values({
              userId,
              dayNumber: d.day as any,
              taskIndex: idx as any,
              label,
              templateId: templateId as any,
              isCompleted: false,
            });
            idx++;
          }
        }
        tasks = await db
          .select()
          .from(imatUserPlanTasks)
          .where(eq(imatUserPlanTasks.userId as any, userId))
          .orderBy(asc(imatUserPlanTasks.dayNumber), asc(imatUserPlanTasks.taskIndex), asc(imatUserPlanTasks.id));
      }
      return NextResponse.json({ data: { plan: existing, days: groupTasks(tasks) } });
    }

    // Create plan and seed tasks for the user from IMAT_PLANNER
    const startDate = new Date();
    const [plan] = await db
      .insert(imatUserPlan)
      .values({ userId, startDate: startDate as any, currentDay: 1 as any })
      .returning();

    for (const d of IMAT_PLANNER.days) {
      let idx = 0;
      for (const label of d.tasks) {
        const tpl = await db
          .select({ id: imatTaskTemplates.id })
          .from(imatTaskTemplates)
          .where(and(eq(imatTaskTemplates.dayNumber as any, d.day as any), eq(imatTaskTemplates.taskIndex as any, idx as any)))
          .limit(1);
        let templateId: number;
        if (tpl[0]?.id) templateId = Number(tpl[0].id);
        else {
          const ins = await db.insert(imatTaskTemplates).values({ dayNumber: d.day as any, taskIndex: idx as any, label }).returning({ id: imatTaskTemplates.id });
          templateId = Number(ins[0].id);
        }
        await db.insert(imatUserPlanTasks).values({
          userId,
          dayNumber: d.day as any,
          taskIndex: idx as any,
          label,
          templateId: templateId as any,
          isCompleted: false,
        });
        idx++;
      }
    }

    const tasks = await db
      .select()
      .from(imatUserPlanTasks)
      .where(eq(imatUserPlanTasks.userId as any, userId))
      .orderBy(asc(imatUserPlanTasks.dayNumber), asc(imatUserPlanTasks.taskIndex), asc(imatUserPlanTasks.id));
    return NextResponse.json({ data: { plan, days: groupTasks(tasks) } }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to initialize" }, { status: 500 });
  }
}

function groupTasks(rows: any[]) {
  const byDay: Record<number, { day: number; title: string; rest?: boolean; tasks: any[]; videos?: any[]; lessons?: any[]; chapters?: any[] }> = {} as any;
  for (const r of rows) {
    const dn = Number(r.dayNumber);
    const meta = IMAT_PLANNER.days.find((d) => d.day === dn);
    if (!byDay[dn]) {
      byDay[dn] = { day: dn, title: meta ? meta.title : `Day ${dn}`, rest: meta?.rest, tasks: [], videos: meta?.videos || [], lessons: meta?.lessons || [], chapters: meta?.chapters || [] };
    }
    byDay[dn].tasks.push({ id: r.id, label: r.label, isCompleted: r.isCompleted });
  }
  return Object.values(byDay);
}
