import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { todos, users } from "@/drizzle/schema";
import { and, asc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { rateAllow, clientIpFrom } from "@/lib/rate-limit";
// XP awarding disabled: remove xp utilities

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = `todos:update:${userId}:${clientIpFrom(req)}`;
  if (!rateAllow(key, 60, 60_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  try {
    const row = (await db.select().from(todos).where(eq(todos.id as any, id)).limit(1))[0] as any;
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (Number(row.userId) !== Number(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updates: any = {};
    if (typeof body?.label === 'string') updates.label = String(body.label).slice(0, 400);
    if (typeof body?.done === 'boolean') updates.done = !!body.done;
    if (typeof body?.position === 'number') updates.position = Number(body.position);

    // XP awarding removed — no XP will be granted for todos
    if (Object.keys(updates).length > 0) {
      await db.update(todos).set(updates).where(eq(todos.id as any, id));
    }

    // Keep a stable response shape but no XP/progress
    const xpDelta = 0;
    const progress = null;

    const fresh = (await db.select().from(todos).where(eq(todos.id as any, id)).limit(1))[0];
    return NextResponse.json({ data: fresh, xpAwarded: xpDelta, progress });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const row = (await db.select().from(todos).where(eq(todos.id as any, id)).limit(1))[0] as any;
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (Number(row.userId) !== Number(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await db.delete(todos).where(eq(todos.id as any, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
