export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { universities, universityScores } from "@/drizzle/schema";
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
    let inserted = 0;
    for (const u of list) {
      const existing = await db.select().from(universityScores).where(eq(universityScores.universityId, u.id));
      if (existing.length >= years.length * 2) continue; // heuristic: already filled
      for (const year of years) {
        const base = 45 + (Math.abs(u.id * 13 + year) % 20); // deterministic-ish base
        const eu = Math.max(30, Math.min(85, base + ((year % 2 === 0) ? -3 : 2)));
        const noneu = Math.max(35, Math.min(95, base + ((year % 3 === 0) ? 5 : -1)));
        await db.insert(universityScores).values({ universityId: u.id, year, candidateType: 'EU', minScore: eu });
        await db.insert(universityScores).values({ universityId: u.id, year, candidateType: 'NonEU', minScore: noneu });
        inserted += 2;
      }
    }
    return NextResponse.json({ ok: true, inserted });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}

