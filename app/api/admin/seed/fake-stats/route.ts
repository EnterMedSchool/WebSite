export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { universities, universityScores, universitySeats } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

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
    const list = await db.select({ id: universities.id, name: universities.name }).from(universities);
    const years = [2019, 2020, 2021, 2022, 2023, 2024];
    let insertedScores = 0;
    let insertedSeats = 0;
    for (const u of list) {
      const existingScores = await db.select().from(universityScores).where(eq(universityScores.universityId, u.id));
      const existingSeats = await db.select().from(universitySeats).where(eq(universitySeats.universityId, u.id));
      for (const year of years) {
        if (existingScores.find((r: any) => r.year === year && r.candidateType === 'EU') == null) {
          const base = 45 + (Math.abs(u.id * 13 + year) % 20); // deterministic-ish base
          const eu = Math.max(30, Math.min(85, base + ((year % 2 === 0) ? -3 : 2)));
          await db.insert(universityScores).values({ universityId: u.id, year, candidateType: 'EU', minScore: eu });
          insertedScores += 1;
        }
        if (existingScores.find((r: any) => r.year === year && r.candidateType === 'NonEU') == null) {
          const base = 45 + (Math.abs(u.id * 13 + year) % 20);
          const noneu = Math.max(35, Math.min(95, base + ((year % 3 === 0) ? 5 : -1)));
          await db.insert(universityScores).values({ universityId: u.id, year, candidateType: 'NonEU', minScore: noneu });
          insertedScores += 1;
        }
        if (existingSeats.find((r: any) => r.year === year && r.candidateType === 'EU') == null) {
          const seatsEU = 60 + ((u.id + year) % 40); // 60–99
          await db.insert(universitySeats).values({ universityId: u.id, year, candidateType: 'EU', seats: seatsEU });
          insertedSeats += 1;
        }
        if (existingSeats.find((r: any) => r.year === year && r.candidateType === 'NonEU') == null) {
          const seatsNonEU = 10 + ((u.id * 7 + year) % 30); // 10–39
          await db.insert(universitySeats).values({ universityId: u.id, year, candidateType: 'NonEU', seats: seatsNonEU });
          insertedSeats += 1;
        }
      }
    }
    return NextResponse.json({ ok: true, insertedScores, insertedSeats });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
