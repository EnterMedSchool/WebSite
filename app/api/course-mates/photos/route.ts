export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resolveUserIdFromSession } from "@/lib/user";
import { isCourseModerator } from "@/lib/course-mates/moderation";

async function listPhotos(courseId: number) {
  const r = await sql`SELECT p.id, p.url, p.caption
                      FROM course_event_photos p
                      WHERE p.event_id IN (
                        SELECT id FROM course_events WHERE course_id=${courseId} ORDER BY start_at DESC LIMIT 50
                      )
                      ORDER BY p.created_at DESC
                      LIMIT 30`;
  return r.rows;
}

export async function GET() {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const me = (await sql`SELECT medical_course_id FROM users WHERE id=${userId} LIMIT 1`).rows[0] || {};
    const courseId = me?.medical_course_id || 0;
    if (!courseId) return NextResponse.json({ data: [] });
    const data = await listPhotos(courseId);
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
    const url = (body?.url || '').toString().trim();
    const caption = (body?.caption || '').toString().trim() || null;
    const eventId = body?.eventId ? Number(body.eventId) : null;
    if (!url || !/^https?:\/\//i.test(url)) return NextResponse.json({ error: 'invalid_url' }, { status: 400 });
    // If event not provided, pick the latest event in this course
    let finalEventId = eventId;
    if (!finalEventId) {
      const r = await sql`SELECT id FROM course_events WHERE course_id=${courseId} ORDER BY start_at DESC LIMIT 1`;
      finalEventId = r.rows[0]?.id || null;
    }
    if (!finalEventId) return NextResponse.json({ error: 'no_event' }, { status: 400 });
    await sql`INSERT INTO course_event_photos (event_id, url, caption, added_by) VALUES (${finalEventId}, ${url}, ${caption}, ${userId})`;
    const data = await listPhotos(courseId);
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

