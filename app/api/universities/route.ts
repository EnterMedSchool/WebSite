import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { countries, universities, universityPrograms, universityScores, universityTestimonials, universityCosts, universityAdmissions } from "@/drizzle/schema";
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
  // DB-backed extras shown in UI
  costRent?: number;
  costFoodIndex?: number;
  costTransport?: number;
  admOpens?: string;
  admDeadline?: string;
  admResults?: string;
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

    // Compute derived rating (avg testimonials), lastScore (latest NonEU>EU>Any),
    // latest costs and current year's admissions months.
    const ids = rows.map(r => r.id as number).filter(Boolean);
    let avgById = new Map<number, number>();
    let lastScoreById = new Map<number, number>();
    let costsById = new Map<number, { rent?: number|null; food?: number|null; transport?: number|null }>();
    let admissionsById = new Map<number, { opens?: number|null; deadline?: number|null; results?: number|null }>();
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

      // Latest costs by updated_at (or by id if equal)
      const cRows = await db
        .select({
          uid: universityCosts.universityId,
          rent: universityCosts.rentEur,
          food: universityCosts.foodIndex,
          transport: universityCosts.transportEur,
          updatedAt: universityCosts.updatedAt,
          id: universityCosts.id,
        })
        .from(universityCosts)
        .where(inArray(universityCosts.universityId, ids));
      const latest: Record<number, { rent?: number|null; food?: number|null; transport?: number|null; updatedAt: any; id: number }>
        = {} as any;
      for (const c of cRows) {
        const uid = Number(c.uid);
        const cur = latest[uid];
        if (!cur || (c.updatedAt as any) > cur.updatedAt || (c.updatedAt === cur.updatedAt && Number(c.id) > cur.id)) {
          latest[uid] = { rent: c.rent as any, food: c.food as any, transport: c.transport as any, updatedAt: c.updatedAt, id: Number(c.id) };
        }
      }
      costsById = new Map(Object.entries(latest).map(([k,v]) => [Number(k), { rent: v.rent ?? null, food: v.food ?? null, transport: v.transport ?? null }]));

      // Admissions: prefer current year, else latest available
      const year = new Date().getUTCFullYear();
      const aRows = await db
        .select({
          uid: universityAdmissions.universityId,
          year: universityAdmissions.year,
          opens: universityAdmissions.opensMonth,
          deadline: universityAdmissions.deadlineMonth,
          results: universityAdmissions.resultsMonth,
        })
        .from(universityAdmissions)
        .where(inArray(universityAdmissions.universityId, ids));
      const pick: Record<number, { year: number; opens?: number|null; deadline?: number|null; results?: number|null }> = {} as any;
      for (const a of aRows) {
        const uid = Number(a.uid);
        const yr = Number(a.year);
        const cur = pick[uid];
        if (!cur || yr > cur.year || (cur.year !== year && yr === year)) {
          pick[uid] = { year: yr, opens: a.opens as any, deadline: a.deadline as any, results: a.results as any };
        }
      }
      admissionsById = new Map(Object.entries(pick).map(([k,v]) => [Number(k), { opens: v.opens ?? null, deadline: v.deadline ?? null, results: v.results ?? null }]));
    }

    const data: CountryCities = {};
    const MONTHS = [
      "January","February","March","April","May","June","July","August","September","October","November","December"
    ];
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
        costRent: costsById.get(r.id as number)?.rent ?? undefined,
        costFoodIndex: costsById.get(r.id as number)?.food ?? undefined,
        costTransport: costsById.get(r.id as number)?.transport ?? undefined,
        admOpens: (() => { const m = admissionsById.get(r.id as number)?.opens; return m ? MONTHS[(m-1)%12] : undefined; })(),
        admDeadline: (() => { const m = admissionsById.get(r.id as number)?.deadline; return m ? MONTHS[(m-1)%12] : undefined; })(),
        admResults: (() => { const m = admissionsById.get(r.id as number)?.results; return m ? MONTHS[(m-1)%12] : undefined; })(),
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
