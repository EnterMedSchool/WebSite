export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resolveUserIdFromSession } from "@/lib/user";
import { verifiedCourseForUser } from "@/lib/course-mates/guard";

async function loadFeed(courseId: number) {
  const r = await sql`SELECT p.id, p.content, p.created_at, u.name, u.username, u.image
                      FROM course_feed_posts p
                      LEFT JOIN users u ON u.id = p.user_id
                      WHERE p.course_id=${courseId}
                      ORDER BY p.created_at DESC
                      LIMIT 20`;
  return r.rows;
}

export async function GET() {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const ctx = await verifiedCourseForUser(userId);
    if (!ctx) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const data = await loadFeed(ctx.courseId);
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const me = (await sql`SELECT medical_course_id, mates_verified FROM users WHERE id=${userId} LIMIT 1`).rows[0] || {};
    if (!me?.mates_verified) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const courseId = me?.medical_course_id || 0;
    if (!courseId) return NextResponse.json({ error: 'no_course' }, { status: 400 });
    const body = await request.json().catch(() => ({}));
    const content = (body?.content || '').toString().trim();
    if (!content) return NextResponse.json({ error: 'empty' }, { status: 400 });
    if (content.length > 1000) return NextResponse.json({ error: 'too_long' }, { status: 400 });
    await sql`INSERT INTO course_feed_posts (course_id, user_id, content) VALUES (${courseId}, ${userId}, ${content})`;
    const data = await loadFeed(courseId);
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}
