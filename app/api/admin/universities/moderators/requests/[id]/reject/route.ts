export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminEmail } from "@/lib/admin";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdminEmail();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const id = Number(params?.id || 0);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
  try {
    const body = await request.json().catch(() => ({} as any));
    const note = typeof body?.note === 'string' ? body.note : null;
    const pr = await sql`SELECT id FROM university_moderator_requests WHERE id=${id} AND status='pending' LIMIT 1`;
    if (!pr.rows[0]?.id) return NextResponse.json({ error: 'no_pending' }, { status: 404 });
    await sql`UPDATE university_moderator_requests SET status='rejected', reviewed_at=now(), note=COALESCE(note,'')||${note? ' '+note : ' rejected'} WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

