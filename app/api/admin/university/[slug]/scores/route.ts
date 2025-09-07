export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { countries, universities, universityScores, universitySeats } from "@/drizzle/schema";
import { and, eq, inArray } from "drizzle-orm";

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

async function resolveUni(slug: string) {
  const rows = await db
    .select({ id: universities.id, name: universities.name, country: countries.name })
    .from(universities)
    .leftJoin(countries, eq(universities.countryId, countries.id));
  const u = rows.find((r) => slugify(r.name) === slug);
  return u ? { id: u.id, name: u.name, country: u.country ?? null } : null;
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const uni = await resolveUni(params.slug);
    if (!uni) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const [scores, seats] = await Promise.all([
      db.select().from(universityScores).where(eq(universityScores.universityId, uni.id)).then((r)=> r.sort((a:any,b:any)=>a.year-b.year)),
      db.select().from(universitySeats).where(eq(universitySeats.universityId, uni.id)).then((r)=> r.sort((a:any,b:any)=>a.year-b.year)),
    ]);
    return NextResponse.json({ uni, scores, seats });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { slug: string } }) {
  const forbidden = requireKey(request);
  if (forbidden) return forbidden;
  try {
    const uni = await resolveUni(params.slug);
    if (!uni) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const url = new URL(request.url);
    const keepParam = (url.searchParams.get("keepYears") ?? "").trim();
    const keep = keepParam
      ? keepParam
          .split(",")
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n))
      : [];

    if (keep.length === 0) {
      await db.delete(universityScores).where(eq(universityScores.universityId, uni.id));
      await db.delete(universitySeats).where(eq(universitySeats.universityId, uni.id));
      return NextResponse.json({ ok: true, kept: [] });
    }

    // Keep selected years by reading them first then deleting all and reinserting the kept ones
    const keptScores = await db
      .select()
      .from(universityScores)
      .where(and(eq(universityScores.universityId, uni.id), inArray(universityScores.year, keep)));
    const keptSeats = await db
      .select()
      .from(universitySeats)
      .where(and(eq(universitySeats.universityId, uni.id), inArray(universitySeats.year, keep)));

    await db.delete(universityScores).where(eq(universityScores.universityId, uni.id));
    await db.delete(universitySeats).where(eq(universitySeats.universityId, uni.id));

    if (keptScores.length) {
      await db.insert(universityScores).values(
        keptScores.map((r: any) => ({ universityId: r.universityId, year: r.year, candidateType: r.candidateType, minScore: r.minScore }))
      );
    }
    if (keptSeats.length) {
      await db.insert(universitySeats).values(
        keptSeats.map((r: any) => ({ universityId: r.universityId, year: r.year, candidateType: r.candidateType, seats: r.seats }))
      );
    }

    return NextResponse.json({ ok: true, kept: keep });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}

