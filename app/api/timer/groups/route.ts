import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { timerGroups } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function genCode(len = 8) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let seed = (globalThis.crypto as any)?.randomUUID?.() || String(Math.random()) + Date.now();
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  let out = "";
  for (let i = 0; i < len; i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    out += alphabet[h % alphabet.length];
  }
  return out;
}

// Create or reuse owner’s timer group
export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const existing = (await db
      .select({ id: timerGroups.id, code: timerGroups.code })
      .from(timerGroups)
      .where(eq(timerGroups.ownerUserId as any, userId))
      .limit(1))[0];
    if (existing?.id) return NextResponse.json({ data: { code: existing.code } });

    // Default state: paused with no endAt
    const nowIso = new Date().toISOString();
    const state = { mode: "paused", endAt: null, durationMs: null, pausedAt: nowIso, updatedAt: nowIso };
    // generate unique-ish code (retry couple times)
    let code = genCode(8);
    for (let i = 0; i < 3; i++) {
      const taken = await db.select({ id: timerGroups.id }).from(timerGroups).where(eq(timerGroups.code as any, code)).limit(1);
      if (!taken[0]) break;
      code = genCode(8);
    }
    const inserted = await db.insert(timerGroups).values({ code, ownerUserId: userId, state: state as any }).returning({ code: timerGroups.code });
    return NextResponse.json({ data: { code: inserted[0].code } }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
