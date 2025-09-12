export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resolveUserIdFromSession } from "@/lib/user";

export async function POST(request: Request) {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const me = (await sql`SELECT university_id FROM users WHERE id=${userId} LIMIT 1`).rows[0] || {};
    const universityId = me?.university_id || 0;
    if (!universityId) return NextResponse.json({ error: 'no_university' }, { status: 400 });
    const body = await request.json().catch(() => ({}));
    const note = (body?.note || '').toString().trim() || null;
    const existing = await sql`SELECT id FROM university_moderator_requests WHERE user_id=${userId} AND university_id=${universityId} AND status='pending' ORDER BY created_at DESC LIMIT 1`;
    if (existing.rows[0]?.id) {
      await sql`UPDATE university_moderator_requests SET note=${note}, created_at=now() WHERE id=${Number(existing.rows[0].id)}`;
    } else {
      await sql`INSERT INTO university_moderator_requests (user_id, university_id, note, status) VALUES (${userId}, ${universityId}, ${note}, 'pending')`;
    }
    return NextResponse.json({ ok: true, pending: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

