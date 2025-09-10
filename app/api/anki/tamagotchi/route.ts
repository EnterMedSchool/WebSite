import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ankiTamagotchi } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { rateAllow } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = (
    await db.select().from(ankiTamagotchi).where(eq(ankiTamagotchi.userId as any, userId)).limit(1)
  )[0] as any;

  if (!row) return NextResponse.json({ state: null });
  return NextResponse.json({ state: row.state ?? null, updatedAt: row.updatedAt ?? null });
}

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const state = body?.state;
  if (typeof state !== "object" || state === null) {
    return NextResponse.json({ error: "state must be an object" }, { status: 400 });
  }
  // Limit updates to 60/min per user (best-effort)
  if (!rateAllow(`anki:tama:update:user:${userId}`, 60, 60_000)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }
  try {
    const [saved] = await db
      .insert(ankiTamagotchi)
      .values({ userId, state })
      .onConflictDoUpdate({ target: [ankiTamagotchi.userId], set: { state, updatedAt: new Date() as any } })
      .returning();
    const res = NextResponse.json({ state: saved.state, updatedAt: saved.updatedAt });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to save" }, { status: 500 });
  }
}
