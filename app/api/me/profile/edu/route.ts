export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resolveUserIdFromSession } from "@/lib/user";

function normInt(x: any): number | null {
  const n = Number(x); return Number.isFinite(n) && n > 0 && n <= 2147483647 ? Math.trunc(n) : null;
}

export async function GET() {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const ur = await sql`SELECT id, university_id, school_id, medical_course_id, study_year, mates_verified FROM users WHERE id=${userId} LIMIT 1`;
    const u = ur.rows[0] || {};
    const approved = {
      universityId: u?.university_id || null,
      schoolId: u?.school_id || null,
      medicalCourseId: u?.medical_course_id || null,
      studyYear: u?.study_year || null,
      isVerified: !!u?.mates_verified,
    };

    const pr = await sql`SELECT id, university_id, school_id, medical_course_id, study_year, status, created_at
                         FROM user_education_requests
                         WHERE user_id=${userId} AND status='pending'
                         ORDER BY created_at DESC LIMIT 1`;
    let pending = pr.rows[0] ? {
      id: Number(pr.rows[0].id),
      universityId: pr.rows[0].university_id,
      schoolId: pr.rows[0].school_id,
      medicalCourseId: pr.rows[0].medical_course_id,
      studyYear: pr.rows[0].study_year,
      status: pr.rows[0].status,
      createdAt: pr.rows[0].created_at,
    } : null;

    // Hide pending if it matches approved values exactly
    if (
      pending &&
      pending.universityId === approved.universityId &&
      pending.schoolId === approved.schoolId &&
      pending.medicalCourseId === approved.medicalCourseId &&
      pending.studyYear === approved.studyYear
    ) {
      pending = null;
    }

    const universities = (await sql`SELECT id, name FROM universities ORDER BY name ASC`).rows;

    // Provide dependent lists based on pending request first, else approved
    const baseUni = pending?.universityId ?? approved.universityId;
    const baseSchool = pending?.schoolId ?? approved.schoolId;
    const schools = baseUni ? (await sql`SELECT id, name, slug FROM schools WHERE university_id=${baseUni} ORDER BY name ASC`).rows : [];
    let courses: any[] = [];
    if (baseSchool && baseUni) {
      courses = (await sql`SELECT id, name, slug FROM medical_school_courses WHERE school_id=${baseSchool} AND university_id=${baseUni} ORDER BY name ASC`).rows;
    } else if (baseSchool) {
      courses = (await sql`SELECT id, name, slug FROM medical_school_courses WHERE school_id=${baseSchool} ORDER BY name ASC`).rows;
    } else if (baseUni) {
      courses = (await sql`SELECT id, name, slug FROM medical_school_courses WHERE university_id=${baseUni} ORDER BY name ASC`).rows;
    }

    return NextResponse.json({ approved, pending, universities, schools, courses });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    let { universityId, schoolId, medicalCourseId, studyYear } = body || {};
    universityId = normInt(universityId);
    schoolId = normInt(schoolId);
    medicalCourseId = normInt(medicalCourseId);
    studyYear = normInt(studyYear);
    if (studyYear != null && (studyYear < 1 || studyYear > 12)) studyYear = null;

    if (universityId) {
      const r = await sql`SELECT 1 FROM universities WHERE id=${universityId} LIMIT 1`;
      if (!r.rows[0]) return NextResponse.json({ error: 'invalid_university' }, { status: 400 });
    }
    if (schoolId) {
      const r = await sql`SELECT 1 FROM schools WHERE id=${schoolId} LIMIT 1`;
      if (!r.rows[0]) return NextResponse.json({ error: 'invalid_school' }, { status: 400 });
    }
    if (medicalCourseId) {
      const r = await sql`SELECT 1 FROM medical_school_courses WHERE id=${medicalCourseId} LIMIT 1`;
      if (!r.rows[0]) return NextResponse.json({ error: 'invalid_course' }, { status: 400 });
    }
    if (schoolId && universityId) {
      const r = await sql`SELECT 1 FROM schools WHERE id=${schoolId} AND university_id=${universityId} LIMIT 1`;
      if (!r.rows[0]) return NextResponse.json({ error: 'school_university_mismatch' }, { status: 400 });
    }
    if (medicalCourseId && (schoolId || universityId)) {
      let ok = false;
      if (schoolId && universityId) {
        const x = await sql`SELECT 1 FROM medical_school_courses WHERE id=${medicalCourseId} AND school_id=${schoolId} AND university_id=${universityId} LIMIT 1`;
        ok = !!x.rows[0];
      } else if (schoolId) {
        const x = await sql`SELECT 1 FROM medical_school_courses WHERE id=${medicalCourseId} AND school_id=${schoolId} LIMIT 1`;
        ok = !!x.rows[0];
      } else if (universityId) {
        const x = await sql`SELECT 1 FROM medical_school_courses WHERE id=${medicalCourseId} AND university_id=${universityId} LIMIT 1`;
        ok = !!x.rows[0];
      }
      if (!ok) return NextResponse.json({ error: 'course_parent_mismatch' }, { status: 400 });
    }

    // Fetch current approved/verified mapping
    const curR = await sql`SELECT university_id, school_id, medical_course_id, study_year, mates_verified FROM users WHERE id=${userId} LIMIT 1`;
    const cur = curR.rows[0] || {} as any;
    const isVerified = !!cur?.mates_verified;

    // If already verified and only year changes (same uni/school/course), allow immediate year update
    const sameUni = universityId == null || Number(universityId) === Number(cur.university_id || 0);
    const sameSchool = schoolId == null || Number(schoolId) === Number(cur.school_id || 0);
    const sameCourse = medicalCourseId == null || Number(medicalCourseId) === Number(cur.medical_course_id || 0);
    const yearChanged = studyYear != null && Number(studyYear) !== Number(cur.study_year || 0);

    if (isVerified && sameUni && sameSchool && sameCourse && yearChanged) {
      await sql`UPDATE users SET study_year=${studyYear} WHERE id=${userId}`;
      // Supersede pending request that only targeted year for same mapping
      try {
        const p = await sql`SELECT id FROM user_education_requests
                             WHERE user_id=${userId} AND status='pending'
                               AND (university_id IS NOT DISTINCT FROM ${cur.university_id})
                               AND (school_id IS NOT DISTINCT FROM ${cur.school_id})
                               AND (medical_course_id IS NOT DISTINCT FROM ${cur.medical_course_id})
                             ORDER BY created_at DESC LIMIT 1`;
        if (p.rows[0]?.id) {
          await sql`UPDATE user_education_requests SET status='superseded', reviewed_at=now(), note='auto-superseded: year changed by user' WHERE id=${Number(p.rows[0].id)}`;
        }
      } catch {}
      return await GET();
    }

    // Upsert pending request: if latest pending exists, update; else insert
    const pr = await sql`SELECT id FROM user_education_requests WHERE user_id=${userId} AND status='pending' ORDER BY created_at DESC LIMIT 1`;
    if (pr.rows[0]?.id) {
      const reqId = Number(pr.rows[0].id);
      await sql`UPDATE user_education_requests
                SET university_id=${universityId}, school_id=${schoolId}, medical_course_id=${medicalCourseId}, study_year=${studyYear}, created_at=now()
                WHERE id=${reqId}`;
    } else {
      await sql`INSERT INTO user_education_requests (user_id, university_id, school_id, medical_course_id, study_year, status)
                VALUES (${userId}, ${universityId}, ${schoolId}, ${medicalCourseId}, ${studyYear}, 'pending')`;
    }

    return await GET();
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}
