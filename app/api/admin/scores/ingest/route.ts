export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { countries, universities, universityScores, universitySeats } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

function requireKey(request: Request) {
  const url = new URL(request.url);
  const qp = url.searchParams.get("key");
  const headerKey = request.headers.get("x-admin-key");
  const key = (qp ?? headerKey ?? "").trim().replace(/^['"]|['"]$/g, "");
  const secret = (process.env.SEED_SECRET ?? process.env.ADMIN_SECRET ?? "").trim().replace(/^['"]|['"]$/g, "");
  if (!secret || !key || key !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type IngestEntry = {
  name: string;
  slug?: string;
  seatsNonEU?: number | null;
  scoreNonEU?: number | null;
  year: number;
};

export async function POST(request: Request) {
  const forbidden = requireKey(request);
  if (forbidden) return forbidden;
  try {
    const body = (await request.json()) as { entries: IngestEntry[] } | IngestEntry[];
    const entries: IngestEntry[] = Array.isArray(body) ? body : body.entries;
    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: "No entries provided" }, { status: 400 });
    }

    // Load universities once and build a slug map for matching
    const uniRows = await db
      .select({ id: universities.id, name: universities.name })
      .from(universities);
    const bySlug = new Map<string, { id: number; name: string }>();
    for (const u of uniRows) bySlug.set(slugify(u.name), { id: u.id, name: u.name });

    // Common aliases (can extend as needed)
    const aliases: Record<string, string> = {
      "la-sapienza": "sapienza-university-of-rome",
      "la-sapienza-dentistry": "sapienza-university-of-rome",
      "tor-vergata": "university-of-rome-tor-vergata",
      "milano-statale": "university-of-milan",
      "pavia": "university-of-pavia",
      "bologna": "university-of-bologna",
      "padova": "university-of-padua",
      "turin": "university-of-turin",
      "bicocca": "university-of-milan-bicocca",
      "federico-ii": "university-of-naples-federico-ii",
      "parma": "university-of-parma",
      "messina": "university-of-messina",
      "luigi-vanvitelli": "university-of-campania-luigi-vanvitelli",
      "bari": "university-of-bari-aldo-moro",
      "catania": "university-of-catania",
      "marche-ancona": "marche-polytechnic-university",
      "cagliari": "university-of-cagliari",
      "siena-dentistry": "university-of-siena",
      "siena": "university-of-siena",
    };

    const results: Array<{ name: string; matched?: string; createdScores?: boolean; updatedScores?: boolean; createdSeats?: boolean; updatedSeats?: boolean; error?: string }>
      = [];

    for (const row of entries) {
      try {
        const rawSlug = row.slug ? slugify(row.slug) : slugify(row.name);
        const mappedSlug = aliases[rawSlug] ?? rawSlug;
        const uni = bySlug.get(mappedSlug);
        if (!uni) {
          results.push({ name: row.name, error: `No university found for slug '${mappedSlug}'` });
          continue;
        }

        let createdScores = false, updatedScores = false, createdSeats = false, updatedSeats = false;

        if (row.scoreNonEU != null) {
          const existing = (await db
            .select()
            .from(universityScores)
            .where(and(eq(universityScores.universityId, uni.id), eq(universityScores.year, row.year), eq(universityScores.candidateType, 'NonEU'))))[0];
          if (existing) {
            await db
              .update(universityScores)
              .set({ minScore: Number(row.scoreNonEU) })
              .where(and(eq(universityScores.universityId, uni.id), eq(universityScores.year, row.year), eq(universityScores.candidateType, 'NonEU')));
            updatedScores = true;
          } else {
            await db.insert(universityScores).values({ universityId: uni.id, year: row.year, candidateType: 'NonEU', minScore: Number(row.scoreNonEU) });
            createdScores = true;
          }
        }

        if (row.seatsNonEU != null) {
          const existingS = (await db
            .select()
            .from(universitySeats)
            .where(and(eq(universitySeats.universityId, uni.id), eq(universitySeats.year, row.year), eq(universitySeats.candidateType, 'NonEU'))))[0];
          if (existingS) {
            await db
              .update(universitySeats)
              .set({ seats: Number(row.seatsNonEU) })
              .where(and(eq(universitySeats.universityId, uni.id), eq(universitySeats.year, row.year), eq(universitySeats.candidateType, 'NonEU')));
            updatedSeats = true;
          } else {
            await db.insert(universitySeats).values({ universityId: uni.id, year: row.year, candidateType: 'NonEU', seats: Number(row.seatsNonEU) });
            createdSeats = true;
          }
        }

        results.push({ name: row.name, matched: uni.name, createdScores, updatedScores, createdSeats, updatedSeats });
      } catch (e: any) {
        results.push({ name: row.name, error: String(e?.message ?? e) });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
