export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminEmail } from "@/lib/admin";

export async function GET(request: Request) {
  const admin = await requireAdminEmail();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const url = new URL(request.url);
  const courseId = Number(url.searchParams.get('courseId') || 0) || null;
  try {
    const rows = courseId ? (await sql`SELECT m.id, m.course_id, m.user_id, u.name, u.username, u.email
                                        FROM course_mates_moderators m
                                        LEFT JOIN users u ON u.id = m.user_id
                                        WHERE m.course_id=${courseId}
                                        ORDER BY u.name NULLS LAST, u.username NULLS LAST`).rows
                          : (await sql`SELECT m.id, m.course_id, m.user_id, u.name, u.username, u.email
                                        FROM course_mates_moderators m
                                        LEFT JOIN users u ON u.id = m.user_id
                                        ORDER BY m.course_id ASC, u.name NULLS LAST`).rows;
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
    const courseId = Number(body?.courseId || 0);
    if (!Number.isFinite(userId) || !Number.isFinite(courseId) || userId <= 0 || courseId <= 0) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    await sql`INSERT INTO course_mates_moderators (course_id, user_id) VALUES (${courseId}, ${userId}) ON CONFLICT (course_id, user_id) DO NOTHING`;
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
    const courseId = Number(body?.courseId || 0);
    if (!Number.isFinite(userId) || !Number.isFinite(courseId) || userId <= 0 || courseId <= 0) return NextResponse.json({ error: 'invalid' }, { status: 400 });
    await sql`DELETE FROM course_mates_moderators WHERE course_id=${courseId} AND user_id=${userId}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

