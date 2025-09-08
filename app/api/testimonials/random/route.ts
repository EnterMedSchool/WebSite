import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await sql`
      SELECT t.id, t.author, t.quote, t.rating,
             u.id as university_id, u.title as university_title, u.logo_url as logo_url
      FROM university_testimonials t
      JOIN universities u ON u.id = t.university_id
      ORDER BY random()
      LIMIT 12`;
    return NextResponse.json({ testimonials: r.rows });
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}

