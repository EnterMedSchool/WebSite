export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resolveUserIdFromSession } from "@/lib/user";
import { isCourseModerator } from "@/lib/course-mates/moderation";

async function listUpcoming(courseId: number) {
  const r = await sql`SELECT id, title, start_at, end_at, location
                      FROM course_events
                      WHERE course_id=${courseId} AND start_at >= now() - interval '1 day'
                      ORDER BY start_at ASC
                      LIMIT 20`;
  return r.rows;
}

export async function GET() {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const me = (await sql`SELECT medical_course_id FROM users WHERE id=${userId} LIMIT 1`).rows[0] || {};
    const courseId = me?.medical_course_id || 0;
    if (!courseId) return NextResponse.json({ data: [] });
    const data = await listUpcoming(courseId);
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const me = (await sql`SELECT medical_course_id FROM users WHERE id=${userId} LIMIT 1`).rows[0] || {};
    const courseId = me?.medical_course_id || 0;
    if (!courseId) return NextResponse.json({ error: 'no_course' }, { status: 400 });
    const mod = await isCourseModerator(userId, courseId);
    if (!mod) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const title = (body?.title || '').toString().trim();
    const startAt = new Date(body?.startAt || body?.start_at || Date.now());
    const endAt = body?.endAt ? new Date(body.endAt) : null;
    const location = (body?.location || '').toString().trim() || null;
    const description = (body?.description || '').toString().trim() || null;
    if (!title || !Number.isFinite(startAt.getTime())) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    // Cast dates to ISO strings to satisfy SQL param typing
    const startAtIso = startAt.toISOString();
    const endAtIso = endAt ? endAt.toISOString() : null;
    await sql`INSERT INTO course_events (course_id, title, start_at, end_at, location, description, created_by)
              VALUES (${courseId}, ${title}, ${startAtIso}, ${endAtIso}, ${location}, ${description}, ${userId})`;
    const data = await listUpcoming(courseId);
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}
