import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { timerGroups } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function etagFor(state: any, updatedAt: string | null | undefined): string {
  const u = updatedAt || state?.updatedAt || "";
  return 'W/"' + (u ? String(Date.parse(u)) : '0') + '"';
}

export async function GET(req: Request, { params }: { params: { code: string } }) {
  try {
    const rows = await db.select().from(timerGroups).where(eq(timerGroups.code as any, params.code)).limit(1);
    const g = rows[0];
    if (!g) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const tag = etagFor((g as any).state, (g as any).updatedAt);
    const inm = (req.headers as any).get?.("if-none-match");
    if (inm && inm === tag) {
      const res304 = new NextResponse(null, { status: 304 });
      res304.headers.set("ETag", tag);
      res304.headers.set("Cache-Control", "no-store");
      return res304;
    }
    const res = NextResponse.json({ data: { state: (g as any).state } });
    res.headers.set("ETag", tag);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

// Owner-only state changes
export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "").trim();
  const durationMs = typeof body?.durationMs === 'number' ? Number(body.durationMs) : undefined;
  try {
    const rows = await db.select().from(timerGroups).where(eq(timerGroups.code as any, params.code)).limit(1);
    const g = rows[0] as any;
    if (!g) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (Number(g.ownerUserId) !== Number(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const now = new Date();
    const nowIso = now.toISOString();
    let state: any = g.state || {};
    if (action === 'start') {
      if (!durationMs || durationMs <= 0) return NextResponse.json({ error: 'durationMs required' }, { status: 400 });
      const end = new Date(now.getTime() + durationMs);
      state = { mode: 'running', endAt: end.toISOString(), durationMs, pausedAt: null, updatedAt: nowIso };
    } else if (action === 'pause') {
      state = { ...state, mode: 'paused', pausedAt: nowIso, updatedAt: nowIso };
    } else if (action === 'reset') {
      state = { mode: 'paused', endAt: null, durationMs: null, pausedAt: nowIso, updatedAt: nowIso };
    } else if (action === 'extend') {
      const curEnd = state?.endAt ? new Date(state.endAt).getTime() : now.getTime();
      if (!durationMs || durationMs <= 0) return NextResponse.json({ error: 'durationMs required' }, { status: 400 });
      const end = new Date(Math.max(now.getTime(), curEnd) + durationMs);
      state = { ...state, mode: 'running', endAt: end.toISOString(), durationMs: (state?.durationMs ?? null), updatedAt: nowIso };
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updated = await db
      .update(timerGroups)
      .set({ state: state as any, updatedAt: now as any })
      .where(eq(timerGroups.id as any, g.id))
      .returning({ code: timerGroups.code, updatedAt: timerGroups.updatedAt });
    const tag = etagFor(state, updated[0]?.updatedAt as any);
    const res = NextResponse.json({ data: { state } });
    res.headers.set("ETag", tag);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
