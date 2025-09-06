export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  countries,
  universities,
  universityScores,
  universitySeats,
  universityTestimonials,
  universityMedia,
  universityArticles,
} from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  try {
    const uniRows = await db
      .select({
        id: universities.id,
        name: universities.name,
        city: universities.city,
        kind: universities.kind,
        lat: universities.lat,
        lng: universities.lng,
        rating: universities.rating,
        logoUrl: universities.logoUrl,
        country: countries.name,
      })
      .from(universities)
      .leftJoin(countries, eq(universities.countryId, countries.id));

    const uni = uniRows.find((u) => slugify(u.name) === slug);
    if (!uni) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [scores, seats, testimonials, media, articles] = await Promise.all([
      db.select().from(universityScores).where(eq(universityScores.universityId, uni.id)).then((r) => r.sort((a,b)=>a.year-b.year)),
      db.select().from(universitySeats).where(eq(universitySeats.universityId, uni.id)).then((r) => r.sort((a,b)=>a.year-b.year)),
      db.select().from(universityTestimonials).where(eq(universityTestimonials.universityId, uni.id)).then((r)=>r.slice(-6)),
      db.select().from(universityMedia).where(eq(universityMedia.universityId, uni.id)).then((r)=>r.slice(-8)),
      db.select().from(universityArticles).where(eq(universityArticles.universityId, uni.id)).then((r)=>r.slice(-6)),
    ]);

    return NextResponse.json({ university: uni, scores, seats, testimonials, media, articles });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}

