export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdminEmail } from "@/lib/admin";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdminEmail();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const id = Number(params?.id || 0);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  try {
    const pr = await sql`SELECT id, user_id, university_id, school_id, medical_course_id, study_year FROM user_education_requests WHERE id=${id} AND status='pending' LIMIT 1`;
    if (!pr.rows[0]?.id) return NextResponse.json({ error: 'no_pending_request' }, { status: 404 });
    const row = pr.rows[0];
    await sql`UPDATE users SET university_id=${row.university_id}, school_id=${row.school_id}, medical_course_id=${row.medical_course_id}, study_year=${row.study_year}, mates_verified=true WHERE id=${row.user_id}`;
    await sql`UPDATE user_education_requests SET status='approved', reviewed_at=now(), note=COALESCE(note,'')||' approved via admin panel' WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

