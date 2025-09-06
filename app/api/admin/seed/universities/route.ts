export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { countries, universities, universityPrograms } from "@/drizzle/schema";
import { demoUniversities } from "@/data/universities";
import { and, eq } from "drizzle-orm";

function requireKey(request: Request) {
  const url = new URL(request.url);
  const qp = url.searchParams.get("key");
  const headerKey = request.headers.get("x-seed-key");
  const key = (qp ?? headerKey ?? "").trim().replace(/^['"]|['"]$/g, "");
  const secret = (process.env.SEED_SECRET ?? "").trim().replace(/^['"]|['"]$/g, "");
  if (!secret || !key || key !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(request: Request) {
  const forbidden = requireKey(request);
  if (forbidden) return forbidden;

  try {
    let createdCountries = 0;
    let createdUniversities = 0;

    // Map of country name -> id
    const countryIdByName = new Map<string, number>();

    // Ensure all countries exist
    for (const country of Object.keys(demoUniversities)) {
      const existing = await db.select().from(countries).where(eq(countries.name, country));
      if (existing.length > 0) {
        countryIdByName.set(country, existing[0].id);
        continue;
      }
      const inserted = await db
        .insert(countries)
        .values({ name: country })
        .returning({ id: countries.id });
      countryIdByName.set(country, inserted[0].id);
      createdCountries++;
    }

    // Insert universities per country
    for (const [country, list] of Object.entries(demoUniversities)) {
      const countryId = countryIdByName.get(country)!;
      for (const u of list) {
        // Check if exists by unique-ish tuple (country, city, name)
        const existing = await db
          .select()
          .from(universities)
          .where(
            and(
              eq(universities.countryId, countryId),
              eq(universities.city, u.city),
              eq(universities.name, u.uni)
            )
          );
        if (existing.length > 0) continue;

        const insertedUni = await db.insert(universities).values({
          countryId,
          city: u.city,
          name: u.uni,
          lat: u.lat,
          lng: u.lng,
          kind: (u.kind as any) ?? null,
          language: (u as any).language ?? 'English',
          admissionExam: (u as any).exam ?? null,
          logoUrl: u.logo ?? null,
          photos: u.photos ? (u.photos as any) : null,
          orgs: u.orgs ? (u.orgs as any) : null,
          article: u.article ? (u.article as any) : null,
        } as any).returning({ id: universities.id });
        // Create a default program row
        const uniId = insertedUni[0]?.id;
        if (uniId) {
          await db.insert(universityPrograms).values({
            universityId: uniId,
            name: 'Medicine and Surgery',
            language: ((u as any).language as string) ?? 'English',
            admissionExam: ((u as any).exam as string) ?? null,
            currency: 'EUR',
            active: true,
          } as any);
        }
        createdUniversities++;
      }
    }

    return NextResponse.json({ ok: true, createdCountries, createdUniversities });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
