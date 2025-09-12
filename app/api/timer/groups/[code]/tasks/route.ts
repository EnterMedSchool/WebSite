import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { timerGroups, timerGroupMembers, todos, users } from "@/drizzle/schema";
import { and, eq, inArray, asc, desc, gt } from "drizzle-orm";
import { kvAvailable, kvGetJSON, kvSetJSON } from "@/lib/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function makeTag(membersCount: number, maxSeen: string | null, maxTodo: string | null) {
  const a = membersCount;
  const b = maxSeen ? Date.parse(maxSeen) : 0;
  const c = maxTodo ? Date.parse(maxTodo) : 0;
  return 'W/"' + a + '-' + b + '-' + c + '"';
}

export async function GET(req: Request, { params }: { params: { code: string } }) {
  try {
    const g = (await db.select({ id: timerGroups.id }).from(timerGroups).where(eq(timerGroups.code as any, params.code)).limit(1))[0];
    if (!g?.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Active within 5 minutes
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);
    const memberRows = await db
      .select({ userId: timerGroupMembers.userId })
      .from(timerGroupMembers)
      .where(and(eq(timerGroupMembers.groupId as any, g.id), gt(timerGroupMembers.lastSeenAt as any, cutoff as any)))
      .limit(24);
    const uids = memberRows.map((r: any) => Number(r.userId));
    if (!uids.length) return NextResponse.json({ data: [] });

    const topUsers = await db
      .select({ id: users.id, name: users.name, username: users.username, image: users.image })
      .from(users)
      .where(inArray(users.id as any, uids as any))
      .limit(24);
    // Compute ETag primitives
    const seenRow = await db
      .select({ m: sql`MAX(last_seen_at)` as any })
      .from(timerGroupMembers)
      .where(and(eq(timerGroupMembers.groupId as any, g.id), gt(timerGroupMembers.lastSeenAt as any, cutoff as any)));
    const maxSeen: any = (seenRow as any)[0]?.m ?? null;
    const todoMaxRow = uids.length ? await db
      .select({ m: sql`MAX(updated_at)` as any })
      .from(todos)
      .where(and(inArray(todos.userId as any, uids as any), eq(todos.done as any, false))) : [];
    const maxTodo: any = (todoMaxRow as any)[0]?.m ?? null;
    const tag = makeTag(uids.length, maxSeen as any, maxTodo as any);
    const inm = (req.headers as any).get?.("if-none-match");
    const kvKey = `tg:${params.code}:tasks`;
    if (kvAvailable()) {
      const cached = await kvGetJSON<{ etag: string; data: any[] }>(kvKey);
      if (cached && cached.etag === inm) {
        const res304 = new NextResponse(null, { status: 304 });
        res304.headers.set("ETag", cached.etag);
        res304.headers.set("Cache-Control", "no-store");
        return res304;
      }
      if (cached && (!inm || cached.etag !== inm)) {
        const res = NextResponse.json({ data: cached.data });
        res.headers.set("ETag", cached.etag);
        res.headers.set("Cache-Control", "no-store");
        return res;
      }
    }
    if (inm && inm === tag) {
      const res304 = new NextResponse(null, { status: 304 });
      res304.headers.set("ETag", tag);
      res304.headers.set("Cache-Control", "no-store");
      return res304;
    }

    const tasks = await db
      .select()
      .from(todos)
      .where(and(inArray(todos.userId as any, uids as any), eq(todos.done as any, false)))
      .orderBy(asc(todos.userId), asc(todos.position), asc(todos.id))
      .limit(24 * 5);

    // group by user
    const byUser: Record<number, any> = {};
    for (const u of topUsers) byUser[Number((u as any).id)] = { userId: Number((u as any).id), user: u, items: [] as any[] };
    for (const t of tasks) {
      const uid = Number((t as any).userId);
      if (!byUser[uid] || byUser[uid].items.length >= 5) continue;
      byUser[uid].items.push({ id: (t as any).id, label: (t as any).label });
    }
    const data = Object.values(byUser).filter((g) => (g as any).items.length > 0);
    const res = NextResponse.json({ data });
    res.headers.set("ETag", tag);
    res.headers.set("Cache-Control", "no-store");
    if (kvAvailable()) { try { await kvSetJSON(kvKey, { etag: tag, data }, 60); } catch {} }
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
