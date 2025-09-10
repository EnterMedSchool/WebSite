export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resolveUserIdFromSession } from "@/lib/user";

export async function GET() {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const ur = await sql`SELECT id, university_id, school_id, medical_course_id, study_year, name, username, image FROM users WHERE id=${userId} LIMIT 1`;
    const me = ur.rows[0] || {};
    const uniId = me?.university_id || null;
    const schoolId = me?.school_id || null;
    const courseId = me?.medical_course_id || null;
    const year = me?.study_year || null;

    const universities = (await sql`SELECT id, name FROM universities ORDER BY name ASC`).rows;
    const schools = uniId ? (await sql`SELECT id, name, slug FROM schools WHERE university_id=${uniId} ORDER BY name ASC`).rows : [];
    const courses = courseId || schoolId || uniId
      ? (await sql`SELECT id, name, slug
                   FROM medical_school_courses
                   WHERE (${schoolId} IS NULL OR school_id = ${schoolId})
                     AND (${uniId} IS NULL OR university_id = ${uniId})
                   ORDER BY name ASC`).rows
      : [];

    // Organizations at university, optionally also linked to this school
    const orgs = uniId ? (await sql`
      SELECT DISTINCT so.id, so.name, so.slug, so.website, so.description
      FROM student_organizations so
      LEFT JOIN student_organization_schools sos ON sos.organization_id = so.id
      WHERE so.university_id=${uniId} AND (${schoolId} IS NULL OR sos.school_id=${schoolId})
      ORDER BY so.name ASC
    `).rows : [];

    // Mates: users in same course + study year
    let mates: any[] = [];
    if (courseId && year) {
      const mr = await sql`
        SELECT id, name, username, image
        FROM users
        WHERE id <> ${userId} AND medical_course_id=${courseId} AND study_year=${year}
        ORDER BY id ASC
        LIMIT 50`;
      mates = mr.rows;
    }

    return NextResponse.json({
      me: {
        id: me?.id, name: me?.name, username: me?.username, image: me?.image,
        universityId: uniId, schoolId, medicalCourseId: courseId, studyYear: year,
      },
      universities,
      schools,
      courses,
      organizations: orgs,
      mates,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    let { universityId, schoolId, medicalCourseId, studyYear } = body || {};

    // Normalize
    function normInt(x: any): number | null {
      const n = Number(x); return Number.isFinite(n) && n > 0 && n <= 2147483647 ? Math.trunc(n) : null;
    }
    universityId = normInt(universityId);
    schoolId = normInt(schoolId);
    medicalCourseId = normInt(medicalCourseId);
    studyYear = normInt(studyYear);
    if (studyYear != null && (studyYear < 1 || studyYear > 12)) studyYear = null;

    // Validate existence if provided
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

    // Basic integrity: if school provided, ensure its university matches provided (if provided)
    if (schoolId && universityId) {
      const x = await sql`SELECT 1 FROM schools WHERE id=${schoolId} AND university_id=${universityId} LIMIT 1`;
      if (!x.rows[0]) return NextResponse.json({ error: 'school_university_mismatch' }, { status: 400 });
    }
    if (medicalCourseId && (schoolId || universityId)) {
      const x = await sql`SELECT 1
                          FROM medical_school_courses
                          WHERE id=${medicalCourseId}
                            AND (${schoolId} IS NULL OR school_id=${schoolId})
                            AND (${universityId} IS NULL OR university_id=${universityId})
                          LIMIT 1`;
      if (!x.rows[0]) return NextResponse.json({ error: 'course_parent_mismatch' }, { status: 400 });
    }

    await sql`UPDATE users SET university_id=${universityId}, school_id=${schoolId}, medical_course_id=${medicalCourseId}, study_year=${studyYear} WHERE id=${userId}`;
    return await GET();
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}
