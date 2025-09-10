import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { imatUserPlanTasks } from "@/drizzle/schema";
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
      .select({ id: imatUserPlanTasks.id, label: imatUserPlanTasks.label, isCompleted: imatUserPlanTasks.isCompleted, taskIndex: imatUserPlanTasks.taskIndex })
      .from(imatUserPlanTasks)
      .where(and(eq(imatUserPlanTasks.userId as any, userId), eq(imatUserPlanTasks.dayNumber as any, day)))
      .orderBy(asc(imatUserPlanTasks.taskIndex), asc(imatUserPlanTasks.id));
    return NextResponse.json({ data: { day, items } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load" }, { status: 500 });
  }
}

