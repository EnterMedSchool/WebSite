export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { countries, universities } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (process.env.ADMIN_SEED_TOKEN && token !== process.env.ADMIN_SEED_TOKEN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Ensure tables exist (idempotent DDL)
  await sql`CREATE TABLE IF NOT EXISTS countries (
    id serial PRIMARY KEY,
    name varchar(120) NOT NULL UNIQUE,
    iso_a3 varchar(3),
    center_lat double precision,
    center_lng double precision,
    created_at timestamp NOT NULL DEFAULT now()
  );`;
  await sql`CREATE INDEX IF NOT EXISTS countries_name_idx ON countries (name);`;

  await sql`CREATE TABLE IF NOT EXISTS universities (
    id serial PRIMARY KEY,
    country_id integer NOT NULL,
    city varchar(120) NOT NULL,
    name varchar(200) NOT NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    kind varchar(10),
    logo_url varchar(500),
    rating double precision,
    last_score integer,
    photos jsonb,
    orgs jsonb,
    article jsonb,
    created_at timestamp NOT NULL DEFAULT now()
  );`;
  await sql`CREATE INDEX IF NOT EXISTS universities_country_idx ON universities (country_id);`;
  await sql`CREATE INDEX IF NOT EXISTS universities_city_idx ON universities (city);`;

  // Import demo data and seed
  const { demoUniversities } = await import("@/data/universities");
  let insertedCountries = 0;
  let insertedUniversities = 0;

  for (const [countryName, cities] of Object.entries(demoUniversities)) {
    // Upsert country by name
    let ctry = await db.select().from(countries).where(eq(countries.name, countryName)).limit(1);
    let countryId: number;
    if (ctry.length === 0) {
      const res = await db.insert(countries).values({ name: countryName }).returning({ id: countries.id });
      countryId = res[0].id as number;
      insertedCountries++;
    } else {
      countryId = (ctry[0] as any).id as number;
    }

    for (const u of cities) {
      const exists = await db
        .select({ id: universities.id })
        .from(universities)
        .where(and(eq(universities.countryId, countryId), eq(universities.name, u.uni)))
        .limit(1);
      if (exists.length) continue;
      await db.insert(universities).values({
        countryId,
        city: u.city,
        name: u.uni,
        lat: u.lat,
        lng: u.lng,
        kind: u.kind ?? null,
        logoUrl: u.logo ?? null,
        rating: u.rating ?? null,
        lastScore: u.lastScore ?? null,
        photos: u.photos ?? null,
        orgs: u.orgs ?? null,
        article: u.article ?? null,
      });
      insertedUniversities++;
    }
  }

  return NextResponse.json({ ok: true, insertedCountries, insertedUniversities });
}

