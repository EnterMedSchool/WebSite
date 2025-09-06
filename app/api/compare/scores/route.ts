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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const list = (url.searchParams.get("unis") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) return NextResponse.json({ series: [] });
  try {
    // Fetch all universities and map slug -> id
    const rows = await db
      .select({ id: universities.id, name: universities.name, country: countries.name })
      .from(universities)
      .leftJoin(countries, eq(universities.countryId, countries.id));
    const bySlug = new Map<string, { id: number; name: string; country: string | null }>();
    for (const r of rows) bySlug.set(slugify(r.name), { id: r.id, name: r.name, country: (r.country as any) ?? null });

    const ids: number[] = [];
    const nameById = new Map<number, { name: string; country: string | null }>();
    for (const s of list) {
      const entry = bySlug.get(s);
      if (entry) { ids.push(entry.id); nameById.set(entry.id, { name: entry.name, country: entry.country }); }
    }
    if (ids.length === 0) return NextResponse.json({ series: [] });

    const scoreRows = await db
      .select()
      .from(universityScores)
      .where(inArray(universityScores.universityId, ids));
    const seatRows = await db
      .select()
      .from(universitySeats)
      .where(inArray(universitySeats.universityId, ids));

    const series: Array<{ uni: string; country: string | null; points: Array<{ year: number; type: string; score: number }>; seats: Array<{ year: number; type: string; seats: number }> }> = [];
    for (const id of ids) {
      const pts = scoreRows
        .filter((r) => r.universityId === id)
        .map((r) => ({ year: r.year, type: r.candidateType, score: r.minScore as number }))
        .sort((a, b) => a.year - b.year);
      const se = seatRows
        .filter((r) => r.universityId === id)
        .map((r) => ({ year: r.year, type: r.candidateType, seats: r.seats as number }))
        .sort((a, b) => a.year - b.year);
      const info = nameById.get(id)!;
      series.push({ uni: info.name, country: info.country, points: pts, seats: se });
    }

    return NextResponse.json({ series });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
