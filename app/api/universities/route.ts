import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { countries, universities, universityPrograms, universityScores, universityTestimonials, universityCosts, universityAdmissions, universitySeats } from "@/drizzle/schema";
import { eq, sql, inArray } from "drizzle-orm";

// Types reused by the map UI
export type City = {
  id: number;
  slug?: string;
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
  // Lightweight 3-year trend for mini charts (prevents per-card API calls)
  trendPoints?: Array<{ year: number; type: string; score: number }>;
  trendSeats?: Array<{ year: number; type: string; seats: number }>;
};
export type CountryCities = Record<string, City[]>;

// Small helper shared across this module
function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Serve via dynamic handler but let the CDN cache by URL for a long time.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = (searchParams.get("scope") || "markers").toLowerCase();
    const countryName = searchParams.get("name") || undefined;
    const includeHeavy = scope === "country";
    // Pre-aggregate program language/exam (one row per university)
    const progAgg = db
      .select({
        universityId: universityPrograms.universityId,
        language: sql<string>`max(${universityPrograms.language})`,
        admissionExam: sql<string>`max(${universityPrograms.admissionExam})`,
      })
      .from(universityPrograms)
      .groupBy(universityPrograms.universityId)
      .as("progAgg");

    // Join universities with countries and aggregated program data to get a single row per uni
    let baseQuery = db
      .select({
        id: universities.id,
        country: countries.name,
        city: universities.city,
        lat: universities.lat,
        lng: universities.lng,
        uni: universities.name,
        kind: universities.kind,
        logo: universities.logoUrl,
        ...(includeHeavy ? { photos: universities.photos, orgs: universities.orgs, article: universities.article } : {}),
        progLang: progAgg.language,
        progExam: progAgg.admissionExam,
        uniLang: universities.language,
        uniExam: universities.admissionExam,
      })
      .from(universities)
      .leftJoin(countries, eq(universities.countryId, countries.id))
      .leftJoin(progAgg, eq(progAgg.universityId, universities.id));

    if (countryName) {
      // Narrow query to a single country when enriching
      baseQuery = (baseQuery as any).where(eq(countries.name, countryName));
    }

    const rows = await baseQuery;

    // Compute derived rating (avg testimonials), lastScore (latest NonEU>EU>Any),
    // latest costs and current year's admissions months.
    const ids = rows.map((r) => r.id as number).filter(Boolean);
    let avgById = new Map<number, number>();
    let lastScoreById = new Map<number, number>();
    let miniTrendPointsById = new Map<number, Array<{ year: number; type: string; score: number }>>();
    let miniTrendSeatsById = new Map<number, Array<{ year: number; type: string; seats: number }>>();
    let costsById = new Map<number, { rent?: number | null; food?: number | null; transport?: number | null }>();
    let admissionsById = new Map<number, { opens?: number | null; deadline?: number | null; results?: number | null }>();

    if (ids.length && includeHeavy) {
      // Ratings (avg)
      const tRows = await db
        .select({ uid: universityTestimonials.universityId, rating: universityTestimonials.rating })
        .from(universityTestimonials)
        .where(inArray(universityTestimonials.universityId, ids));
      const agg: Record<number, { sum: number; n: number }> = {} as any;
      for (const t of tRows) {
        if (t.rating == null) continue;
        const uid = t.uid as number;
        (agg[uid] ||= { sum: 0, n: 0 });
        agg[uid].sum += Number(t.rating);
        agg[uid].n += 1;
      }
      avgById = new Map(Object.entries(agg).map(([k, v]) => [Number(k), v.n ? v.sum / v.n : 0]));

      // Scores/trend
      const sRows = await db
        .select()
        .from(universityScores)
        .where(inArray(universityScores.universityId, ids));
      const best: Record<number, { year: number; score: number; type: string }> = {} as any;
      const nowYear = new Date().getUTCFullYear();
      const cutoff = nowYear - 2; // last 3 years
      const pts: Record<number, Array<{ year: number; type: string; score: number }>> = {} as any;
      for (const s of sRows) {
        const uid = s.universityId as number;
        const cand = s.candidateType as string;
        const yr = s.year as number;
        const sc = Number(s.minScore);
        const cur = best[uid];
        const rank = (t: string) => (t === "NonEU" ? 2 : t === "EU" ? 1 : 0);
        if (!cur || yr > cur.year || (yr === cur.year && rank(cand) > rank(cur.type))) {
          best[uid] = { year: yr, score: sc, type: cand };
        }
        if (yr >= cutoff && (cand === "EU" || cand === "NonEU")) {
          (pts[uid] ||= []).push({ year: yr, type: cand, score: sc });
        }
      }
      lastScoreById = new Map(Object.entries(best).map(([k, v]) => [Number(k), v.score]));
      miniTrendPointsById = new Map(
        Object.entries(pts).map(([k, v]) => [Number(k), (v as any[]).sort((a, b) => a.year - b.year)])
      );

      // Seats trend
      const seatRows = await db
        .select({
          universityId: universitySeats.universityId,
          year: universitySeats.year,
          candidateType: universitySeats.candidateType,
          seats: universitySeats.seats,
        })
        .from(universitySeats)
        .where(inArray(universitySeats.universityId, ids));
      const seatMap: Record<number, Array<{ year: number; type: string; seats: number }>> = {} as any;
      for (const s of seatRows) {
        const uid = Number(s.universityId);
        const yr = Number(s.year);
        const cand = String(s.candidateType);
        if (yr >= cutoff && (cand === "EU" || cand === "NonEU")) {
          (seatMap[uid] ||= []).push({ year: yr, type: cand, seats: Number(s.seats) });
        }
      }
      miniTrendSeatsById = new Map(
        Object.entries(seatMap).map(([k, v]) => [Number(k), (v as any[]).sort((a, b) => a.year - b.year)])
      );

      // Latest costs
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
      const latest: Record<
        number,
        { rent?: number | null; food?: number | null; transport?: number | null; updatedAt: any; id: number }
      > = {} as any;
      for (const c of cRows) {
        const uid = Number(c.uid);
        const cur = latest[uid];
        if (!cur || (c.updatedAt as any) > cur.updatedAt || (c.updatedAt === cur.updatedAt && Number(c.id) > cur.id)) {
          latest[uid] = {
            rent: c.rent as any,
            food: c.food as any,
            transport: c.transport as any,
            updatedAt: c.updatedAt,
            id: Number(c.id),
          };
        }
      }
      costsById = new Map(
        Object.entries(latest).map(([k, v]) => [Number(k), { rent: v.rent ?? null, food: v.food ?? null, transport: v.transport ?? null }])
      );

      // Admissions months
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
      const pick: Record<number, { year: number; opens?: number | null; deadline?: number | null; results?: number | null }> = {} as any;
      for (const a of aRows) {
        const uid = Number(a.uid);
        const yr = Number(a.year);
        const cur = pick[uid];
        if (!cur || yr > cur.year || (cur.year !== year && yr === year)) {
          pick[uid] = { year: yr, opens: a.opens as any, deadline: a.deadline as any, results: a.results as any };
        }
      }
      admissionsById = new Map(
        Object.entries(pick).map(([k, v]) => [Number(k), { opens: v.opens ?? null, deadline: v.deadline ?? null, results: v.results ?? null }])
      );
    }

    const data: CountryCities = {};
    const MONTHS = [
      "January","February","March","April","May","June","July","August","September","October","November","December"
    ];
    for (const r of rows) {
      if (!r.country) continue;
      (data[r.country] ||= []).push({
        id: r.id as number,
        slug: slugify(String(r.uni)),
        city: r.city,
        lat: r.lat as number,
        lng: r.lng as number,
        uni: r.uni,
        kind: (r.kind as any) ?? undefined,
        language: ((r.progLang as any) ?? (r.uniLang as any)) ?? undefined,
        exam: ((r.progExam as any) ?? (r.uniExam as any)) ?? undefined,
        logo: (r.logo as string) ?? undefined,
        rating: includeHeavy ? (avgById.get(r.id as number) ?? undefined) : undefined,
        lastScore: includeHeavy ? (lastScoreById.get(r.id as number) ?? undefined) : undefined,
        photos: includeHeavy ? ((r.photos as string[]) ?? undefined) : undefined,
        orgs: includeHeavy ? ((r.orgs as string[]) ?? undefined) : undefined,
        article: includeHeavy ? ((r.article as any) ?? undefined) : undefined,
        costRent: includeHeavy ? (costsById.get(r.id as number)?.rent ?? undefined) : undefined,
        costFoodIndex: includeHeavy ? (costsById.get(r.id as number)?.food ?? undefined) : undefined,
        costTransport: includeHeavy ? (costsById.get(r.id as number)?.transport ?? undefined) : undefined,
        admOpens: includeHeavy ? (() => { const m = admissionsById.get(r.id as number)?.opens; return m ? MONTHS[(m-1)%12] : undefined; })() : undefined,
        admDeadline: includeHeavy ? (() => { const m = admissionsById.get(r.id as number)?.deadline; return m ? MONTHS[(m-1)%12] : undefined; })() : undefined,
        admResults: includeHeavy ? (() => { const m = admissionsById.get(r.id as number)?.results; return m ? MONTHS[(m-1)%12] : undefined; })() : undefined,
        trendPoints: includeHeavy ? miniTrendPointsById.get(r.id as number) : undefined,
        trendSeats: includeHeavy ? miniTrendSeatsById.get(r.id as number) : undefined,
      });
    }

    return NextResponse.json(
      { data },
      {
        headers: {
          // Public CDN cache; serve cached for 24h, then revalidate in background for a week
          // Dramatically reduces edge/function usage on Vercel.
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (err) {
    // Fallback to demo JSON if DB is not configured
    const { demoUniversities } = await import("@/data/universities");
    return NextResponse.json(
      { data: demoUniversities },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );
  }
}
