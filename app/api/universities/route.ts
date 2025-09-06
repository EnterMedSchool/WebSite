import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { countries, universities } from "@/drizzle/schema";
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
        country: countries.name,
        city: universities.city,
        lat: universities.lat,
        lng: universities.lng,
        uni: universities.name,
        kind: universities.kind,
        language: universities.language,
        exam: universities.admissionExam,
        logo: universities.logoUrl,
        rating: universities.rating,
        lastScore: universities.lastScore,
        photos: universities.photos,
        orgs: universities.orgs,
        article: universities.article,
      })
      .from(universities)
      .leftJoin(countries, eq(universities.countryId, countries.id));

    const data: CountryCities = {};
    for (const r of rows) {
      if (!r.country) continue;
      (data[r.country] ||= []).push({
        city: r.city,
        lat: r.lat as number,
        lng: r.lng as number,
        uni: r.uni,
        kind: (r.kind as any) ?? undefined,
        language: (r.language as any) ?? undefined,
        exam: (r.exam as any) ?? undefined,
        logo: (r.logo as string) ?? undefined,
        rating: (r.rating as number) ?? undefined,
        lastScore: (r.lastScore as number) ?? undefined,
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
