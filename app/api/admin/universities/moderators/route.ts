export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminEmail } from "@/lib/admin";

export async function GET() {
  const admin = await requireAdminEmail();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const rows = (await sql`SELECT m.university_id, m.user_id, u.name, u.username, u.email FROM university_moderators m LEFT JOIN users u ON u.id=m.user_id ORDER BY m.university_id ASC, u.name NULLS LAST`).rows;
    return NextResponse.json({ ok: true, data: rows });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdminEmail();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const body = await request.json().catch(() => ({}));
    const userId = Number(body?.userId || 0);
    const universityId = Number(body?.universityId || 0);
    if (!Number.isFinite(userId) || !Number.isFinite(universityId) || userId <= 0 || universityId <= 0) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    await sql`INSERT INTO university_moderators (university_id, user_id) VALUES (${universityId}, ${userId}) ON CONFLICT (university_id, user_id) DO NOTHING`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdminEmail();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const body = await request.json().catch(() => ({}));
    const userId = Number(body?.userId || 0);
    const universityId = Number(body?.universityId || 0);
    if (!Number.isFinite(userId) || !Number.isFinite(universityId) || userId <= 0 || universityId <= 0) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    await sql`DELETE FROM university_moderators WHERE university_id=${universityId} AND user_id=${userId}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

