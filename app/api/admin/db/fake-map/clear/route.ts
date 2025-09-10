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
    // Cascade-style cleanup joined by seed_tag without sending arrays
    res.scores = (await sql`
      DELETE FROM university_scores s USING universities u
      WHERE s.university_id = u.id AND u.seed_tag = ${tag}
    `).rowCount ?? 0;
    res.seats = (await sql`
      DELETE FROM university_seats s USING universities u
      WHERE s.university_id = u.id AND u.seed_tag = ${tag}
    `).rowCount ?? 0;
    res.costs = (await sql`
      DELETE FROM university_costs c USING universities u
      WHERE c.university_id = u.id AND u.seed_tag = ${tag}
    `).rowCount ?? 0;
    res.admissions = (await sql`
      DELETE FROM university_admissions a USING universities u
      WHERE a.university_id = u.id AND u.seed_tag = ${tag}
    `).rowCount ?? 0;
    res.programs = (await sql`
      DELETE FROM university_programs p USING universities u
      WHERE p.university_id = u.id AND u.seed_tag = ${tag}
    `).rowCount ?? 0;
    res.media = (await sql`
      DELETE FROM university_media m USING universities u
      WHERE m.university_id = u.id AND u.seed_tag = ${tag}
    `).rowCount ?? 0;
    res.articles = (await sql`
      DELETE FROM university_articles a USING universities u
      WHERE a.university_id = u.id AND u.seed_tag = ${tag}
    `).rowCount ?? 0;
    res.testimonials = (await sql`
      DELETE FROM university_testimonials t USING universities u
      WHERE t.university_id = u.id AND u.seed_tag = ${tag}
    `).rowCount ?? 0;
    res.universities = (await sql`DELETE FROM universities WHERE seed_tag = ${tag}`).rowCount ?? 0;
    return NextResponse.json({ ok: true, cleared: res, tag });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
