export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminEmail } from "@/lib/admin";

export async function GET() {
  const admin = await requireAdminEmail();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const rows = (await sql`SELECT r.id, r.user_id, r.university_id, r.note, r.status, r.created_at, u.name, u.username, u.email
                             FROM university_moderator_requests r
                             LEFT JOIN users u ON u.id = r.user_id
                             WHERE r.status='pending'
                             ORDER BY r.created_at ASC`).rows;
    return NextResponse.json({ ok: true, data: rows });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

