export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resolveUserIdFromSession } from "@/lib/user";

export async function GET() {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const me = (await sql`SELECT medical_course_id, study_year, mates_verified FROM users WHERE id=${userId} LIMIT 1`).rows[0] || {};
    const cid = me?.medical_course_id || null; const yr = me?.study_year || null;
    const isVerified = !!me?.mates_verified;
    let matesCount = 0, courseName: string | null = null, schoolName: string | null = null, activeNow = 0;
    if (isVerified && cid && yr) {
      const c = await sql`SELECT name, school_id FROM medical_school_courses WHERE id=${cid} LIMIT 1`;
      courseName = c.rows[0]?.name ?? null;
      const sid = c.rows[0]?.school_id || null;
      if (sid) {
        const s = await sql`SELECT name FROM schools WHERE id=${sid} LIMIT 1`;
        schoolName = s.rows[0]?.name ?? null;
      }
      const r = await sql`SELECT COUNT(*)::int AS n FROM users WHERE id <> ${userId} AND medical_course_id = ${cid} AND study_year = ${yr} AND COALESCE(mates_verified, false) = true`;
      matesCount = Number(r.rows[0]?.n || 0);
      const a = await sql`SELECT COUNT(DISTINCT e.user_id)::int AS n
                           FROM lms_events e
                           JOIN users u ON u.id = e.user_id
                           WHERE e.created_at >= now() - interval '24 hours'
                             AND u.medical_course_id = ${cid}
                             AND u.study_year = ${yr}
                             AND COALESCE(u.mates_verified, false) = true`;
      activeNow = Number(a.rows[0]?.n || 0);
    }
    return NextResponse.json({ matesCount, courseName, schoolName, studyYear: yr ?? null, isVerified, activeNow });
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}

