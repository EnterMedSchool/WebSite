import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { timerGroups, timerGroupMembers } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { rateAllow, clientIpFrom } from "@/lib/rate-limit";
import { kvAvailable, kvGetJSON, kvSetJSON } from "@/lib/kv";

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
    // Try KV cache first for state/etag
    const kvKey = `tg:${params.code}`;
    if (kvAvailable()) {
      const cached = await kvGetJSON<{ state: any; etag: string }>(kvKey);
      if (cached) {
        const inm = (req.headers as any).get?.("if-none-match");
        if (inm && inm === cached.etag) {
          const res304 = new NextResponse(null, { status: 304 });
          res304.headers.set("ETag", cached.etag);
          res304.headers.set("Cache-Control", "no-store");
          // presence piggyback handled below regardless of cache
          // fall-through return 304
          return res304;
        }
        const res = NextResponse.json({ data: { state: cached.state } });
        res.headers.set("ETag", cached.etag);
        res.headers.set("Cache-Control", "no-store");
        return res;
      }
    }
    // Optional presence piggyback via header
    try {
      const join = (req.headers as any).get?.('x-join');
      if (join === '1') {
        const uid = await requireUserId(req);
        if (uid) {
          const existing = (await db
            .select({ id: timerGroupMembers.id, lastSeenAt: timerGroupMembers.lastSeenAt })
            .from(timerGroupMembers)
            .where(and(eq(timerGroupMembers.groupId as any, (g as any).id), eq(timerGroupMembers.userId as any, uid)))
            .limit(1))[0] as any;
          const now = new Date();
          if (!existing?.id) {
            await db.insert(timerGroupMembers).values({ groupId: (g as any).id, userId: uid, lastSeenAt: now as any });
          } else {
            const last = existing?.lastSeenAt ? Date.parse(existing.lastSeenAt) : 0;
            if (!last || (Date.now() - last) > 180000) {
              await db.update(timerGroupMembers).set({ lastSeenAt: now as any }).where(eq(timerGroupMembers.id as any, existing.id));
            }
          }
        }
      }
    } catch {}
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
    if (kvAvailable()) { try { await kvSetJSON(kvKey, { state: (g as any).state, etag: tag }, 90); } catch {} }
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

// Owner-only state changes
export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Rate limit owner updates to ~1/sec (burst 3)
  const key = `timer:update:${userId}:${clientIpFrom(req)}`;
  if (!rateAllow(key, 3, 3_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  // Idempotency-Key (best-effort per instance)
  const idemKeyHeader = (req.headers as any).get?.('idempotency-key') || (req.headers as any).get?.('x-idempotency-key');
  const idemKey = idemKeyHeader ? `${params.code}:${userId}:${String(idemKeyHeader)}` : null;
  const gcache = (globalThis as any);
  if (!gcache.__IDEM_CACHE__) gcache.__IDEM_CACHE__ = new Map();
  const CACHE: Map<string, { ts: number; etag: string; body: any; status: number }> = gcache.__IDEM_CACHE__;
  if (idemKey && CACHE.has(idemKey)) {
    const c = CACHE.get(idemKey)!;
    if (Date.now() - c.ts < 10_000) {
      const cached = new NextResponse(JSON.stringify(c.body), { status: c.status, headers: { 'Content-Type': 'application/json' } });
      cached.headers.set('ETag', c.etag);
      cached.headers.set('Cache-Control', 'no-store');
      return cached;
    } else {
      CACHE.delete(idemKey);
    }
  }
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
    const MAX_MINUTES = 120;
    const MAX_MS = MAX_MINUTES * 60 * 1000;

    if (action === 'start') {
      if (!durationMs || durationMs <= 0) return NextResponse.json({ error: 'durationMs required' }, { status: 400 });
      const clamped = Math.min(durationMs, MAX_MS);
      const end = new Date(now.getTime() + clamped);
      state = { mode: 'running', endAt: end.toISOString(), durationMs, pausedAt: null, updatedAt: nowIso };
    } else if (action === 'pause') {
      state = { ...state, mode: 'paused', pausedAt: nowIso, updatedAt: nowIso };
    } else if (action === 'reset') {
      state = { mode: 'paused', endAt: null, durationMs: null, pausedAt: nowIso, updatedAt: nowIso };
    } else if (action === 'extend') {
      const curEnd = state?.endAt ? new Date(state.endAt).getTime() : now.getTime();
      if (!durationMs || durationMs <= 0) return NextResponse.json({ error: 'durationMs required' }, { status: 400 });
      // total remaining from now cannot exceed MAX_MS
      const remainNow = Math.max(0, curEnd - now.getTime());
      const allowed = Math.max(0, MAX_MS - Math.min(remainNow, MAX_MS));
      const add = Math.min(durationMs, allowed);
      const end = new Date(Math.max(now.getTime(), curEnd) + add);
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
    const payload = { data: { state } };
    const res = NextResponse.json(payload);
    res.headers.set("ETag", tag);
    res.headers.set("Cache-Control", "no-store");
    if (idemKey) CACHE.set(idemKey, { ts: Date.now(), etag: tag, body: payload, status: 200 });
    // Update KV cache for readers
    try { if (kvAvailable()) await kvSetJSON(`tg:${params.code}`, { state, etag: tag }, 90); } catch {}
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
