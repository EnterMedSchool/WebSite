import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { termRatings, terms } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
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
  // Enforce existence of term record (seed first)
  const exists = (
    await db.select({ id: terms.id }).from(terms).where(eq(terms.slug as any, slug)).limit(1)
  )[0];
  if (!exists) return NextResponse.json({ error: "term_not_found" }, { status: 404 });
  const userId = await requireUserId(_req).catch(() => null);

  // Aggregate efficiently with SQL (count/avg/max updated)
  const agg = await db.execute(sql`
    select coalesce(count(*)::int,0) as count,
           coalesce(avg(stars)::float,0) as avg,
           coalesce(max(updated_at), to_timestamp(0)) as max_updated
    from term_ratings where term_slug = ${slug}
  `);
  const row: any = (agg as any)?.rows?.[0] || { count: 0, avg: 0, max_updated: null };
  const count = Number(row.count || 0);
  const avg = Number(row.avg || 0);
  let mine: number | null = null;
  if (userId) {
    const r = (
      await db
        .select({ stars: termRatings.stars })
        .from(termRatings)
        .where(and(eq(termRatings.termSlug as any, slug), eq(termRatings.userId as any, userId)))
        .limit(1)
    )[0];
    if (r?.stars != null) mine = Number(r.stars);
  }
  const tag = `W/"${slug}:${count}:${Math.round(avg * 100)}:${mine ?? -1}:${String(row.max_updated || '')}"`;
  const inm = (_req as any).headers?.get?.("if-none-match") || (new Headers((_req as any).headers)).get("if-none-match");
  if (inm && inm === tag) {
    const res304 = new NextResponse(null, { status: 304 });
    res304.headers.set("ETag", tag);
    res304.headers.set("Cache-Control", "private, max-age=180");
    res304.headers.set("Vary", "Authorization, If-None-Match");
    return res304;
  }
  const res = NextResponse.json({ avg, count, mine });
  res.headers.set("ETag", tag);
  res.headers.set("Cache-Control", "private, max-age=180");
  res.headers.set("Vary", "Authorization, If-None-Match");
  return res;
}

export async function POST(req: Request, ctx: { params: { slug: string } }) {
  const slug = (ctx?.params?.slug || "").toString();
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  if (!/^[a-z0-9][a-z0-9-_]{0,159}$/i.test(slug)) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }
  const exists = (
    await db.select({ id: terms.id }).from(terms).where(eq(terms.slug as any, slug)).limit(1)
  )[0];
  if (!exists) return NextResponse.json({ error: "term_not_found" }, { status: 404 });
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

  // Return updated snapshot (aggregate via SQL)
  const agg = await db.execute(sql`
    select coalesce(count(*)::int,0) as count,
           coalesce(avg(stars)::float,0) as avg,
           coalesce(max(updated_at), to_timestamp(0)) as max_updated
    from term_ratings where term_slug = ${slug}
  `);
  const row: any = (agg as any)?.rows?.[0] || { count: 0, avg: 0, max_updated: null };
  const count = Number(row.count || 0);
  const avg = Number(row.avg || 0);
  const tag = `W/"${slug}:${count}:${Math.round(avg * 100)}:${stars}:${String(row.max_updated || '')}"`;
  const res = NextResponse.json({ avg, count, mine: stars });
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("ETag", tag);
  res.headers.set("Vary", "Authorization, If-None-Match");
  return res;
}
