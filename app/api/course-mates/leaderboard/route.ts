export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resolveUserIdFromSession } from "@/lib/user";

export async function GET() {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const me = (await sql`SELECT medical_course_id, study_year FROM users WHERE id=${userId} LIMIT 1`).rows[0] || {} as any;
    const cid = me?.medical_course_id || 0; const yr = me?.study_year || 0;
    if (!cid || !yr) return NextResponse.json({ weekly: [], all: [] });
    const w = await sql`
      WITH weekly AS (
        SELECT e.user_id, COALESCE(SUM((e.payload->>'amount')::int),0) AS wxp
        FROM lms_events e
        WHERE e.action='xp_awarded' AND e.created_at >= now() - interval '7 days'
        GROUP BY e.user_id
      )
      SELECT u.id, u.username, u.name, u.image, COALESCE(w.wxp,0) AS weekly_xp
      FROM users u
      LEFT JOIN weekly w ON w.user_id = u.id
      WHERE u.medical_course_id=${cid} AND u.study_year=${yr} AND COALESCE(u.mates_verified,false)=true
      ORDER BY COALESCE(w.wxp,0) DESC, u.id ASC
      LIMIT 5`;
    const a = await sql`
      SELECT id, username, name, image, xp
      FROM users
      WHERE medical_course_id=${cid} AND study_year=${yr} AND COALESCE(mates_verified,false)=true
      ORDER BY xp DESC, id ASC
      LIMIT 5`;
    return NextResponse.json({ weekly: w.rows, all: a.rows });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

