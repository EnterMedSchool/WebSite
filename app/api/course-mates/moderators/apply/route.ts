export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resolveUserIdFromSession } from "@/lib/user";

export async function POST(request: Request) {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const me = (await sql`SELECT medical_course_id, mates_verified FROM users WHERE id=${userId} LIMIT 1`).rows[0] || {};
    const courseId = me?.medical_course_id || 0;
    if (!courseId) return NextResponse.json({ error: 'no_course' }, { status: 400 });
    if (!me?.mates_verified) return NextResponse.json({ error: 'not_verified' }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const note = (body?.note || '').toString().trim() || null;
    // Upsert latest pending
    const existing = await sql`SELECT id FROM course_moderator_requests WHERE user_id=${userId} AND course_id=${courseId} AND status='pending' ORDER BY created_at DESC LIMIT 1`;
    if (existing.rows[0]?.id) {
      await sql`UPDATE course_moderator_requests SET note=${note}, created_at=now() WHERE id=${Number(existing.rows[0].id)}`;
    } else {
      await sql`INSERT INTO course_moderator_requests (user_id, course_id, note, status) VALUES (${userId}, ${courseId}, ${note}, 'pending')`;
    }
    return NextResponse.json({ ok: true, pending: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}
