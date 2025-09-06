import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { countries, universities, universityPrograms, universityScores, universityTestimonials } from "@/drizzle/schema";
import { inArray } from "drizzle-orm";
import { eq } from "drizzle-orm";

// Types reused by the map UI
export type City = {
  city: string;
  lat: number;
  lng: number;
  uni: string;
  kind?: "public" | "private";
  language?: string;
  exam?: string;
  logo?: string;
  rating?: number;
  lastScore?: number;
  photos?: string[];
  orgs?: string[];
  article?: { title: string; href?: string };
};
export type CountryCities = Record<string, City[]>;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // Join universities with countries to get country names
    const rows = await db
      .select({
        id: universities.id,
        country: countries.name,
        city: universities.city,
        lat: universities.lat,
        lng: universities.lng,
        uni: universities.name,
        kind: universities.kind,
        logo: universities.logoUrl,
        photos: universities.photos,
        orgs: universities.orgs,
        article: universities.article,
        progLang: universityPrograms.language,
        progExam: universityPrograms.admissionExam,
        uniLang: universities.language,
        uniExam: universities.admissionExam,
      })
      .from(universities)
      .leftJoin(countries, eq(universities.countryId, countries.id))
      .leftJoin(universityPrograms, eq(universityPrograms.universityId, universities.id));

    // Compute derived rating (avg testimonials) and lastScore (latest NonEU>EU>Any)
    const ids = rows.map(r => r.id as number).filter(Boolean);
    let avgById = new Map<number, number>();
    let lastScoreById = new Map<number, number>();
    if (ids.length) {
      const tRows = await db
        .select({ uid: universityTestimonials.universityId, rating: universityTestimonials.rating })
        .from(universityTestimonials)
        .where(inArray(universityTestimonials.universityId, ids));
      const agg: Record<number, { sum: number; n: number }> = {} as any;
      for (const t of tRows) {
        if (t.rating == null) continue;
        const uid = t.uid as number; (agg[uid] ||= { sum: 0, n: 0 }); agg[uid].sum += Number(t.rating); agg[uid].n += 1;
      }
      avgById = new Map(Object.entries(agg).map(([k,v]) => [Number(k), v.n ? v.sum / v.n : 0]));

      const sRows = await db
        .select()
        .from(universityScores)
        .where(inArray(universityScores.universityId, ids));
      const best: Record<number, { year: number; score: number; type: string }> = {} as any;
      for (const s of sRows) {
        const uid = s.universityId as number;
        const cand = s.candidateType as string;
        const yr = s.year as number;
        const sc = Number(s.minScore);
        const cur = best[uid];
        // Prefer latest year; for same year prefer NonEU, then EU, then other.
        const rank = (t: string) => (t === 'NonEU' ? 2 : t === 'EU' ? 1 : 0);
        if (!cur || yr > cur.year || (yr === cur.year && rank(cand) > rank(cur.type))) {
          best[uid] = { year: yr, score: sc, type: cand };
        }
      }
      lastScoreById = new Map(Object.entries(best).map(([k,v]) => [Number(k), v.score]));
    }

    const data: CountryCities = {};
    for (const r of rows) {
      if (!r.country) continue;
      (data[r.country] ||= []).push({
        city: r.city,
        lat: r.lat as number,
        lng: r.lng as number,
        uni: r.uni,
        kind: (r.kind as any) ?? undefined,
        language: ((r.progLang as any) ?? (r.uniLang as any)) ?? undefined,
        exam: ((r.progExam as any) ?? (r.uniExam as any)) ?? undefined,
        logo: (r.logo as string) ?? undefined,
        rating: avgById.get(r.id as number) ?? undefined,
        lastScore: lastScoreById.get(r.id as number) ?? undefined,
        photos: (r.photos as string[]) ?? undefined,
        orgs: (r.orgs as string[]) ?? undefined,
        article: (r.article as any) ?? undefined,
      });
    }

    return NextResponse.json({ data }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (err) {
    // Fallback to demo JSON if DB is not configured
    const { demoUniversities } = await import("@/data/universities");
    return NextResponse.json({ data: demoUniversities }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }
}
