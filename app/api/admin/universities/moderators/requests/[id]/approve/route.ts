export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminEmail } from "@/lib/admin";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdminEmail();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const id = Number(params?.id || 0);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  try {
    const row = (await sql`SELECT id, user_id, university_id FROM university_moderator_requests WHERE id=${id} AND status='pending' LIMIT 1`).rows[0];
    if (!row?.id) return NextResponse.json({ error: 'no_pending' }, { status: 404 });
    await sql`INSERT INTO university_moderators (university_id, user_id) VALUES (${row.university_id}, ${row.user_id}) ON CONFLICT (university_id, user_id) DO NOTHING`;
    await sql`UPDATE university_moderator_requests SET status='approved', reviewed_at=now() WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

