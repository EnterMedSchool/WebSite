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
    const row = (await sql`SELECT id, user_id, course_id FROM course_moderator_requests WHERE id=${id} AND status='pending' LIMIT 1`).rows[0];
    if (!row?.id) return NextResponse.json({ error: 'no_pending' }, { status: 404 });
    await sql`INSERT INTO course_mates_moderators (course_id, user_id) VALUES (${row.course_id}, ${row.user_id}) ON CONFLICT (course_id, user_id) DO NOTHING`;
    await sql`UPDATE course_moderator_requests SET status='approved', reviewed_at=now() WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

