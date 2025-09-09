import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { imatUserPlan, imatUserPlanTasks } from "@/drizzle/schema";
import { asc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { IMAT_PLANNER } from "@/lib/imat/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });
  try {
    const up = (await db.select().from(imatUserPlan).where(eq(imatUserPlan.userId as any, userId)).limit(1))[0];
    if (!up) return NextResponse.json({ data: null });
    const tasks = await db
      .select()
      .from(imatUserPlanTasks)
      .where(eq(imatUserPlanTasks.userId as any, userId))
      .orderBy(asc(imatUserPlanTasks.dayNumber), asc(imatUserPlanTasks.taskIndex), asc(imatUserPlanTasks.id));
    const days = groupTasks(tasks);
    return NextResponse.json({ data: { plan: up, days } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load" }, { status: 500 });
  }
}

function groupTasks(rows: any[]) {
  const byDay: Record<number, { day: number; title: string; rest?: boolean; tasks: any[] }> = {} as any;
  for (const r of rows) {
    const dn = Number(r.dayNumber);
    const meta = IMAT_PLANNER.days.find((d) => d.day === dn);
    if (!byDay[dn]) byDay[dn] = { day: dn, title: meta ? meta.title : `Day ${dn}`, rest: meta?.rest, tasks: [] };
    byDay[dn].tasks.push({ id: r.id, label: r.label, isCompleted: r.isCompleted });
  }
  return Object.values(byDay);
}
