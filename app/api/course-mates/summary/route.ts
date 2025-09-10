export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resolveUserIdFromSession } from "@/lib/user";

export async function GET() {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const me = (await sql`SELECT medical_course_id, study_year FROM users WHERE id=${userId} LIMIT 1`).rows[0] || {};
    const cid = me?.medical_course_id || null; const yr = me?.study_year || null;
    let matesCount = 0, courseName: string | null = null, schoolName: string | null = null;
    if (cid && yr) {
      const c = await sql`SELECT name, school_id FROM medical_school_courses WHERE id=${cid} LIMIT 1`;
      courseName = c.rows[0]?.name ?? null;
      const sid = c.rows[0]?.school_id || null;
      if (sid) {
        const s = await sql`SELECT name FROM schools WHERE id=${sid} LIMIT 1`;
        schoolName = s.rows[0]?.name ?? null;
      }
      const r = await sql`SELECT COUNT(*)::int AS n FROM users WHERE id<>${userId} AND medical_course_id=${cid} AND study_year=${yr}`;
      matesCount = Number(r.rows[0]?.n || 0);
    }
    return NextResponse.json({ matesCount, courseName, schoolName, studyYear: yr ?? null });
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}

