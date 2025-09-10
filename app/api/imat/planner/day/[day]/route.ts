import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { imatUserPlanTasks, imatTaskTemplates } from "@/drizzle/schema";
import { and, asc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { day: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });
  const day = Number(params.day);
  if (!Number.isFinite(day) || day < 1) return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  try {
    const items = await db
      .select({
        id: imatUserPlanTasks.id,
        isCompleted: imatUserPlanTasks.isCompleted,
        taskIndex: imatUserPlanTasks.taskIndex,
        label: imatUserPlanTasks.label,
        tLabel: imatTaskTemplates.label,
      })
      .from(imatUserPlanTasks)
      .leftJoin(imatTaskTemplates, eq(imatTaskTemplates.id as any, imatUserPlanTasks.templateId as any))
      .where(and(eq(imatUserPlanTasks.userId as any, userId), eq(imatUserPlanTasks.dayNumber as any, day)))
      .orderBy(asc(imatUserPlanTasks.taskIndex), asc(imatUserPlanTasks.id));
    const shaped = items.map((r:any)=> ({ id: r.id, isCompleted: r.isCompleted, taskIndex: r.taskIndex, label: r.label || r.tLabel }));
    return NextResponse.json({ data: { day, items: shaped } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { day: string } }) {
  // Persist currentDay for the user's plan
  const { imatUserPlan } = await import("@/drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });
  const day = Number(params.day);
  if (!Number.isFinite(day) || day < 1) return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  try {
    await db.update(imatUserPlan).set({ currentDay: day as any, updatedAt: new Date() as any }).where(eq(imatUserPlan.userId as any, userId));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update" }, { status: 500 });
  }
}
