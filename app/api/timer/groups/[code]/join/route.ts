import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timerGroups, timerGroupMembers } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const g = (await db.select({ id: timerGroups.id }).from(timerGroups).where(eq(timerGroups.code as any, params.code)).limit(1))[0];
    if (!g?.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const now = new Date();
    const existing = (await db
      .select({ id: timerGroupMembers.id, lastSeenAt: timerGroupMembers.lastSeenAt })
      .from(timerGroupMembers)
      .where(and(eq(timerGroupMembers.groupId as any, g.id), eq(timerGroupMembers.userId as any, userId)))
      .limit(1))[0] as any;
    if (!existing?.id) {
      await db.insert(timerGroupMembers).values({ groupId: g.id, userId });
    } else {
      // throttle: only update last_seen_at if > 3 minutes since last update
      const last = existing?.lastSeenAt ? Date.parse(existing.lastSeenAt) : 0;
      if (!last || (Date.now() - last) > 3 * 60 * 1000) {
        await db.update(timerGroupMembers).set({ lastSeenAt: now as any }).where(eq(timerGroupMembers.id as any, existing.id));
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

