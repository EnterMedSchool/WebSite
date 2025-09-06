export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import {
  countries,
  universities,
  universityScores,
  universitySeats,
  universityTestimonials,
  universityMedia,
  universityArticles,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (process.env.ADMIN_SEED_TOKEN && token !== process.env.ADMIN_SEED_TOKEN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Ensure base tables exist (idempotent)
  await sql`CREATE TABLE IF NOT EXISTS university_scores (
    id serial PRIMARY KEY,
    university_id integer NOT NULL,
    year integer NOT NULL,
    candidate_type varchar(24) NOT NULL,
    min_score double precision NOT NULL
  );`;
  await sql`CREATE TABLE IF NOT EXISTS university_seats (
    id serial PRIMARY KEY,
    university_id integer NOT NULL,
    year integer NOT NULL,
    candidate_type varchar(24) NOT NULL,
    seats integer NOT NULL
  );`;
  await sql`CREATE TABLE IF NOT EXISTS university_testimonials (
    id serial PRIMARY KEY,
    university_id integer NOT NULL,
    author varchar(120) NOT NULL,
    quote text NOT NULL,
    rating double precision,
    created_at timestamp NOT NULL DEFAULT now()
  );`;
  await sql`CREATE TABLE IF NOT EXISTS university_media (
    id serial PRIMARY KEY,
    university_id integer NOT NULL,
    type varchar(20) NOT NULL,
    url varchar(500) NOT NULL,
    title varchar(200),
    created_at timestamp NOT NULL DEFAULT now()
  );`;
  await sql`CREATE TABLE IF NOT EXISTS university_articles (
    id serial PRIMARY KEY,
    university_id integer NOT NULL,
    title varchar(200) NOT NULL,
    href varchar(500) NOT NULL,
    published_at timestamp NOT NULL DEFAULT now()
  );`;

  // Find Pavia
  const uniRows = await db
    .select({ id: universities.id, name: universities.name })
    .from(universities);
  const pavia = uniRows.find((u) => slugify(u.name) === "university-of-pavia");
  if (!pavia) return NextResponse.json({ error: "University of Pavia not in DB. Seed base universities first." }, { status: 400 });

  // Seed scores and seats (sample data)
  const years = [2020, 2021, 2022, 2023, 2024];
  const types = [
    { t: "EU", scores: [39.5, 41.0, 42.2, 43.1, 44.0], seats: [70, 72, 74, 76, 78] },
    { t: "NonEU", scores: [48.0, 49.5, 50.0, 51.2, 52.0], seats: [20, 22, 22, 24, 24] },
  ];

  for (let i=0;i<years.length;i++) {
    for (const row of types) {
      await db.insert(universityScores).values({ universityId: pavia.id as number, year: years[i], candidateType: row.t, minScore: row.scores[i] });
      await db.insert(universitySeats).values({ universityId: pavia.id as number, year: years[i], candidateType: row.t, seats: row.seats[i] });
    }
  }

  // Testimonials
  await db.insert(universityTestimonials).values([
    { universityId: pavia.id as number, author: "Sara G.", quote: "Great community and supportive professors.", rating: 4.6 },
    { universityId: pavia.id as number, author: "Marco P.", quote: "Challenging courses with lots of hands-on practice.", rating: 4.4 },
  ]);

  // Media
  await db.insert(universityMedia).values([
    { universityId: pavia.id as number, type: "image", url: "https://entermedschool.b-cdn.net/wp-content/uploads/2023/03/delfin-pQWJrMMmySA-unsplash-150x150.jpg", title: "Campus view" },
    { universityId: pavia.id as number, type: "image", url: "https://entermedschool.b-cdn.net/wp-content/uploads/2023/04/photo_2023-04-10_11-18-15-150x150.jpg", title: "City" },
    { universityId: pavia.id as number, type: "image", url: "https://entermedschool.b-cdn.net/wp-content/uploads/2023/04/photo_2023-04-10_11-18-23-150x150.jpg", title: "River" },
  ]);

  // Articles (links)
  await db.insert(universityArticles).values([
    { universityId: pavia.id as number, title: "Life as an EMS student in Pavia", href: "#" },
  ]);

  return NextResponse.json({ ok: true });
}

