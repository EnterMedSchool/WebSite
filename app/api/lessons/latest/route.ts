import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await sql`SELECT id, title, slug, created_at FROM lessons ORDER BY created_at DESC NULLS LAST LIMIT 8`;
    return NextResponse.json({ lessons: r.rows });
  } catch (e:any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message||e) }, { status: 500 });
  }
}

