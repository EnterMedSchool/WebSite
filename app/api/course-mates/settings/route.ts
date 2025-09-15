export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resolveUserIdFromSession } from "@/lib/user";
import { isCourseModerator } from "@/lib/course-mates/moderation";
import { verifiedCourseForUser } from "@/lib/course-mates/guard";

export async function GET() {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const ctx = await verifiedCourseForUser(userId);
    if (!ctx) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const r = await sql`SELECT study_vibe FROM course_mates_settings WHERE course_id=${ctx.courseId} LIMIT 1`;
    return NextResponse.json({ settings: { studyVibe: r.rows[0]?.study_vibe ?? null } });
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
    const studyVibe = (body?.studyVibe || body?.study_vibe || '').toString().trim().slice(0, 80) || null;
    // Upsert
    const exist = await sql`SELECT 1 FROM course_mates_settings WHERE course_id=${courseId} LIMIT 1`;
    if (exist.rows[0]) {
      await sql`UPDATE course_mates_settings SET study_vibe=${studyVibe} WHERE course_id=${courseId}`;
    } else {
      await sql`INSERT INTO course_mates_settings (course_id, study_vibe) VALUES (${courseId}, ${studyVibe})`;
    }
    return NextResponse.json({ ok: true, settings: { studyVibe } });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}
