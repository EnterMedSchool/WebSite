export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminEmail } from "@/lib/admin";

export async function GET() {
  const admin = await requireAdminEmail();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    const r = await sql`
      SELECT r.id,
             r.user_id,
             u.email,
             u.name,
             r.university_id,
             un.name AS university_name,
             r.school_id,
             s.name  AS school_name,
             r.medical_course_id,
             msc.name AS course_name,
             r.study_year,
             r.status,
             r.created_at
      FROM user_education_requests r
      LEFT JOIN users u ON u.id = r.user_id
      LEFT JOIN universities un ON un.id = r.university_id
      LEFT JOIN schools s ON s.id = r.school_id
      LEFT JOIN medical_school_courses msc ON msc.id = r.medical_course_id
      WHERE r.status = 'pending'
      ORDER BY r.created_at ASC`;
    return NextResponse.json({ ok: true, data: r.rows });
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}

