import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { termComments, users } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { rateAllow } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: Request, ctx: { params: { slug: string } }) {
  const slug = (ctx?.params?.slug || "").toString();
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  if (!/^[a-z0-9][a-z0-9-_]{0,159}$/i.test(slug)) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }
  const rows = await db
    .select({
      id: termComments.id,
      body: termComments.body,
      createdAt: termComments.createdAt,
      userId: termComments.userId,
      username: users.username,
      name: users.name,
      image: users.image,
    })
    .from(termComments)
    .leftJoin(users, eq(users.id as any, termComments.userId))
    .where(eq(termComments.termSlug as any, slug))
    .orderBy(desc(termComments.createdAt as any))
    .limit(50);

  const items = rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt,
    user: {
      id: r.userId,
      display: r.name || r.username || `user-${r.userId}`,
      avatar: r.image || null,
    },
  }));
  return NextResponse.json({ items });
}

export async function POST(req: Request, ctx: { params: { slug: string } }) {
  const slug = (ctx?.params?.slug || "").toString();
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  if (!/^[a-z0-9][a-z0-9-_]{0,159}$/i.test(slug)) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const text: string = (body?.body ?? "").toString().trim();
  if (!text) return NextResponse.json({ error: "body is required" }, { status: 400 });
  if (text.length > 5000) return NextResponse.json({ error: "body too long" }, { status: 400 });
  // Limit comment creation to 10/min per user
  if (!rateAllow(`anki:comment:create:user:${userId}`, 10, 60_000)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const [created] = await db
    .insert(termComments)
    .values({ termSlug: slug, userId, body: text })
    .returning();

  const res = NextResponse.json({
    id: created.id,
    body: created.body,
    createdAt: created.createdAt,
  }, { status: 201 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
