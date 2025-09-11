export const runtime = "nodejs";
// Dynamic route with strong CDN caching per URL (query string)
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { countries, universities, universityScores, universitySeats } from "@/drizzle/schema";
import { eq, inArray } from "drizzle-orm";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawSlugs = searchParams.get("unis") || "";
  const rawIds = searchParams.get("ids") || "";
  const slugs = rawSlugs
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const idsFromQuery = rawIds
    .split(",")
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (slugs.length === 0 && idsFromQuery.length === 0) {
    return NextResponse.json({ series: [] });
  }

  let ids: number[] = idsFromQuery;
  let metaById = new Map<number, { name: string; country: string | null }>();
  if (ids.length === 0 && slugs.length > 0) {
    // Map slugs to ids by querying only candidate rows
    const candidates = await db
      .select({ id: universities.id, name: universities.name, country: countries.name })
      .from(universities)
      .leftJoin(countries, eq(universities.countryId, countries.id));
    const bySlug = new Map<string, { id: number; name: string; country: string | null }>();
    for (const u of candidates) bySlug.set(slugify(u.name), { id: u.id, name: u.name, country: u.country ?? null });
    const selected = slugs
      .map((s) => ({ slug: s, uni: bySlug.get(s) }))
      .filter((x): x is { slug: string; uni: { id: number; name: string; country: string | null } } => !!x.uni);
    if (selected.length === 0) return NextResponse.json({ series: [] });
    ids = selected.map((x) => x.uni.id);
    metaById = new Map(selected.map((x) => [x.uni.id, { name: x.uni.name, country: x.uni.country }]));
  } else if (ids.length > 0) {
    const meta = await db
      .select({ id: universities.id, name: universities.name, country: countries.name })
      .from(universities)
      .leftJoin(countries, eq(universities.countryId, countries.id))
      .where(inArray(universities.id, ids));
    metaById = new Map(meta.map((m) => [m.id, { name: m.name, country: m.country ?? null }]));
  }
  const [scoresAll, seatsAll] = await Promise.all([
    db
      .select({ universityId: universityScores.universityId, year: universityScores.year, candidateType: universityScores.candidateType, minScore: universityScores.minScore })
      .from(universityScores)
      .where(inArray(universityScores.universityId, ids)),
    db
      .select({ universityId: universitySeats.universityId, year: universitySeats.year, candidateType: universitySeats.candidateType, seats: universitySeats.seats })
      .from(universitySeats)
      .where(inArray(universitySeats.universityId, ids)),
  ]);

  const scoresByUni = new Map<number, typeof scoresAll>();
  const seatsByUni = new Map<number, typeof seatsAll>();
  for (const r of scoresAll) (scoresByUni.get(r.universityId) || scoresByUni.set(r.universityId, []).get(r.universityId)!).push(r);
  for (const r of seatsAll) (seatsByUni.get(r.universityId) || seatsByUni.set(r.universityId, []).get(r.universityId)!).push(r);

  const series = ids.map((id) => {
    const meta = metaById.get(id) || { name: String(id), country: null };
    const s = (scoresByUni.get(id) || []).sort((a, b) => a.year - b.year);
    const t = (seatsByUni.get(id) || []).sort((a, b) => a.year - b.year);
    return {
      uni: meta.name,
      country: meta.country,
      points: s.map((r) => ({ year: r.year, type: r.candidateType, score: Number(r.minScore) })),
      seats: t.map((r) => ({ year: r.year, type: r.candidateType, seats: Number(r.seats) })),
    };
  });

  return NextResponse.json(
    { series },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
