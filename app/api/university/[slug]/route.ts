export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  universityCosts,
  universityAdmissions,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { universityPages } from "@/drizzle/schema";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
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
        logoUrl: universities.logoUrl,
        hasDorms: universities.hasDorms,
        hasScholarships: universities.hasScholarships,
        country: countries.name,
      })
      .from(universities)
      .leftJoin(countries, eq(universities.countryId, countries.id));

    const uni = uniRows.find((u) => slugify(u.name) === slug);
    if (!uni) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [scores, seats, testimonials, media, articles, page, costs, admissions] = await Promise.all([
      db.select().from(universityScores).where(eq(universityScores.universityId, uni.id)).then((r) => r.sort((a,b)=>a.year-b.year)),
      db.select().from(universitySeats).where(eq(universitySeats.universityId, uni.id)).then((r) => r.sort((a,b)=>a.year-b.year)),
      db.select().from(universityTestimonials).where(eq(universityTestimonials.universityId, uni.id)).then((r)=>r.slice(-6)),
      db.select().from(universityMedia).where(eq(universityMedia.universityId, uni.id)).then((r)=>r.slice(-8)),
      db.select().from(universityArticles).where(eq(universityArticles.universityId, uni.id)).then((r)=>r.slice(-6)),
      db.select().from(universityPages).where(eq(universityPages.universityId, uni.id)).then((r)=> r[0] ?? null),
      db.select().from(universityCosts).where(eq(universityCosts.universityId, uni.id)),
      db.select().from(universityAdmissions).where(eq(universityAdmissions.universityId, uni.id)),
    ]);

    // Derived rating: average of testimonials
    const avgRating = testimonials.length ? (testimonials.map(t=> Number(t.rating || 0)).filter(n=>!isNaN(n)).reduce((a,b)=>a+b,0) / (testimonials.filter(t=> t.rating!=null).length || 1)) : undefined;
    // Derived lastScore: latest year pref NonEU > EU > Any
    const rank = (t: string) => t === 'NonEU' ? 2 : t === 'EU' ? 1 : 0;
    const best = [...scores].sort((a,b)=> b.year - a.year || rank(b.candidateType as any) - rank(a.candidateType as any))[0];
    const lastScore = best ? Number(best.minScore) : undefined;

    return NextResponse.json({ university: { ...uni, rating: avgRating, lastScore }, scores, seats, testimonials, media, articles, page, costs, admissions });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}





