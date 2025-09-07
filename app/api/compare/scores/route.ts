export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { countries, universities, universityScores, universitySeats } from "@/drizzle/schema";
import { eq, inArray } from "drizzle-orm";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("unis") || "";
  const slugs = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (slugs.length === 0) {
    return NextResponse.json({ series: [] });
  }

  // Load all universities and map by slug
  const uniRows = await db
    .select({ id: universities.id, name: universities.name, country: countries.name })
    .from(universities)
    .leftJoin(countries, eq(universities.countryId, countries.id));

  const bySlug = new Map<string, { id: number; name: string; country: string | null }>();
  for (const u of uniRows) bySlug.set(slugify(u.name), { id: u.id, name: u.name, country: u.country ?? null });

  const selected = slugs
    .map((s) => ({ slug: s, uni: bySlug.get(s) }))
    .filter((x): x is { slug: string; uni: { id: number; name: string; country: string | null } } => !!x.uni);

  if (selected.length === 0) {
    return NextResponse.json({ series: [] });
  }

  const ids = selected.map((x) => x.uni.id);
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

  const series = selected.map(({ uni }) => {
    const s = (scoresByUni.get(uni.id) || []).sort((a, b) => a.year - b.year);
    const t = (seatsByUni.get(uni.id) || []).sort((a, b) => a.year - b.year);
    return {
      uni: uni.name,
      country: uni.country,
      points: s.map((r) => ({ year: r.year, type: r.candidateType, score: Number(r.minScore) })),
      seats: t.map((r) => ({ year: r.year, type: r.candidateType, seats: Number(r.seats) })),
    };
  });

  return NextResponse.json({ series });
}

