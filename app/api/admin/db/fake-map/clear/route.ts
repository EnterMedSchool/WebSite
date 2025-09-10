export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

function requireKey(request: Request) {
  const url = new URL(request.url);
  const qp = url.searchParams.get("key");
  const headerKey = request.headers.get("x-admin-key") || request.headers.get("x-seed-key");
  const key = (qp ?? headerKey ?? "").trim().replace(/^['"]|['"]$/g, "");
  const secret = (process.env.SEED_SECRET ?? process.env.ADMIN_SECRET ?? "").trim().replace(/^['"]|['"]$/g, "");
  if (!secret || !key || key !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function DELETE(request: Request) {
  const forbidden = requireKey(request);
  if (forbidden) return forbidden;
  const url = new URL(request.url);
  const tag = url.searchParams.get("tag") || "FAKE_MAP_BULK_2025_09_10";
  try {
    const res: Record<string, number> = {};
    const ids = await sql`SELECT id FROM universities WHERE seed_tag=${tag}`;
    const idList = ids.rows.map((r: any) => Number(r.id)).filter((n: any) => Number.isFinite(n));
    if (idList.length === 0) {
      return NextResponse.json({ ok: true, cleared: res, note: "no universities matched seed_tag" });
    }
    // Cascade-style cleanup by foreign key
    const idArray = sql.array(idList, 'int4');
    res.scores = (await sql`DELETE FROM university_scores WHERE university_id = ANY(${idArray})`).rowCount ?? 0;
    res.seats = (await sql`DELETE FROM university_seats WHERE university_id = ANY(${idArray})`).rowCount ?? 0;
    res.costs = (await sql`DELETE FROM university_costs WHERE university_id = ANY(${idArray})`).rowCount ?? 0;
    res.admissions = (await sql`DELETE FROM university_admissions WHERE university_id = ANY(${idArray})`).rowCount ?? 0;
    res.programs = (await sql`DELETE FROM university_programs WHERE university_id = ANY(${idArray})`).rowCount ?? 0;
    res.media = (await sql`DELETE FROM university_media WHERE university_id = ANY(${idArray})`).rowCount ?? 0;
    res.articles = (await sql`DELETE FROM university_articles WHERE university_id = ANY(${idArray})`).rowCount ?? 0;
    res.testimonials = (await sql`DELETE FROM university_testimonials WHERE university_id = ANY(${idArray})`).rowCount ?? 0;
    res.universities = (await sql`DELETE FROM universities WHERE id = ANY(${idArray})`).rowCount ?? 0;
    return NextResponse.json({ ok: true, cleared: res, tag });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
