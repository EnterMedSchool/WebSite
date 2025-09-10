import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { termRatings } from "@/drizzle/schema";
import { and, eq, desc } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { rateAllow } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function computeStats(stars: number[]) {
  const count = stars.length;
  const avg = count ? stars.reduce((a, b) => a + b, 0) / count : 0;
  return { avg, count };
}

export async function GET(_req: Request, ctx: { params: { slug: string } }) {
  const slug = (ctx?.params?.slug || "").toString();
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  if (!/^[a-z0-9][a-z0-9-_]{0,159}$/i.test(slug)) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }
  const userId = await requireUserId(_req).catch(() => null);

  const rows = await db
    .select({ stars: termRatings.stars })
    .from(termRatings)
    .where(eq(termRatings.termSlug as any, slug));
  const { avg, count } = computeStats(rows.map((r) => Number(r.stars || 0)));

  let mine: number | null = null;
  if (userId) {
    const r = (
      await db
        .select({ stars: termRatings.stars })
        .from(termRatings)
        .where(
          and(eq(termRatings.termSlug as any, slug), eq(termRatings.userId as any, userId))
        )
        .limit(1)
    )[0];
    if (r?.stars != null) mine = Number(r.stars);
  }
  return NextResponse.json({ avg, count, mine });
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
  let stars = Number((body?.stars ?? 0));
  if (!Number.isFinite(stars)) return NextResponse.json({ error: "stars must be a number" }, { status: 400 });
  stars = Math.max(1, Math.min(5, Math.round(stars)));

  // Limit writes to ratings: 30/min per user
  if (!rateAllow(`anki:rating:set:user:${userId}`, 30, 60_000)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  await db
    .insert(termRatings)
    .values({ termSlug: slug, userId, stars })
    .onConflictDoUpdate({ target: [termRatings.termSlug, termRatings.userId], set: { stars, updatedAt: new Date() as any } });

  // Return updated snapshot
  const rows = await db
    .select({ stars: termRatings.stars })
    .from(termRatings)
    .where(eq(termRatings.termSlug as any, slug));
  const { avg, count } = computeStats(rows.map((r) => Number(r.stars || 0)));
  const res = NextResponse.json({ avg, count, mine: stars });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
