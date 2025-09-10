import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { imatUserPlan } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { day: string } }) {
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

