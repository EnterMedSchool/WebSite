export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

function requireKey(request: Request) {
  const url = new URL(request.url);
  const qp = url.searchParams.get("key");
  const headerKey = request.headers.get("x-admin-key");
  const key = (qp ?? headerKey ?? "").trim().replace(/^['"]|['"]$/g, "");
  const secret = (process.env.SEED_SECRET ?? "").trim().replace(/^['"]|['"]$/g, "");
  if (!secret || !key || key !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function POST(request: Request) {
  const forbidden = requireKey(request);
  if (forbidden) return forbidden;
  try {
    const url = new URL(request.url);
    const userId = Number(url.searchParams.get('userId') || 0);
    const reject = url.searchParams.get('reject') === '1';
    const note = url.searchParams.get('note') || null;
    const reviewerId = Number(url.searchParams.get('reviewedBy') || 0) || null;
    if (!Number.isFinite(userId) || userId <= 0) return NextResponse.json({ error: 'invalid_user' }, { status: 400 });

    const pr = await sql`SELECT id, university_id, school_id, medical_course_id, study_year
                         FROM user_education_requests
                         WHERE user_id=${userId} AND status='pending'
                         ORDER BY created_at DESC LIMIT 1`;
    if (!pr.rows[0]?.id) return NextResponse.json({ error: 'no_pending_request' }, { status: 404 });
    const reqId = Number(pr.rows[0].id);

    if (reject) {
      await sql`UPDATE user_education_requests
                SET status='rejected', note=${note}, reviewed_at=now(), reviewed_by=${reviewerId}
                WHERE id=${reqId}`;
      return NextResponse.json({ ok: true, rejected: true });
    }

    // Approve: update users table and mark verified
    const uniId = pr.rows[0].university_id || null;
    const schoolId = pr.rows[0].school_id || null;
    const courseId = pr.rows[0].medical_course_id || null;
    const year = pr.rows[0].study_year || null;
    await sql`UPDATE users SET university_id=${uniId}, school_id=${schoolId}, medical_course_id=${courseId}, study_year=${year}, mates_verified=true WHERE id=${userId}`;
    await sql`UPDATE user_education_requests
              SET status='approved', note=${note}, reviewed_at=now(), reviewed_by=${reviewerId}
              WHERE id=${reqId}`;

    return NextResponse.json({ ok: true, approved: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

