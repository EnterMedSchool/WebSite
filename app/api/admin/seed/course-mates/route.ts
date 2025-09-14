export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function requireKey(request: Request) {
  const url = new URL(request.url);
  const qp = url.searchParams.get("key");
  const headerKey = request.headers.get("x-seed-key");
  const key = (qp ?? headerKey ?? "").trim().replace(/^['"]|['"]$/g, "");
  const secret = (process.env.SEED_SECRET ?? "").trim().replace(/^['"]|['"]$/g, "");
  if (!secret || !key || key !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function GET(request: Request) { return POST(request); }

export async function POST(request: Request) {
  const forbidden = requireKey(request);
  if (forbidden) return forbidden;
  try {
    const url = new URL(request.url);
    const assignToMe = url.searchParams.get("assignToMe") === "1" || url.searchParams.get("assign") === "1";
    const mates = Math.max(0, Math.min(50, Number(url.searchParams.get("mates") || 0) || 0));
    const yearParam = Number(url.searchParams.get("year") || 1) || 1;
    const year = Math.max(1, Math.min(12, yearParam));

    // Resolve University of Pavia
    const uniRes = await sql`SELECT id, name FROM universities WHERE lower(name) LIKE 'university of pavia%' LIMIT 1`;
    const uniId = uniRes.rows[0]?.id ? Number(uniRes.rows[0].id) : null;
    if (!uniId) {
      return NextResponse.json({ error: 'missing_university', message: 'University of Pavia not found in universities table.' }, { status: 400 });
    }

    // Ensure School of Medicine
    const schoolSlug = 'pavia-medicine';
    const sch = await sql`INSERT INTO schools (university_id, slug, name)
                           VALUES (${uniId}, ${schoolSlug}, 'School of Medicine')
                           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
                           RETURNING id`;
    const schoolId = Number(sch.rows[0].id);

    // Ensure Harvey Course
    const courseSlug = 'harvey-course';
    const cr = await sql`INSERT INTO medical_school_courses (university_id, school_id, slug, name, degree_type, language, duration_years)
                         VALUES (${uniId}, ${schoolId}, ${courseSlug}, 'Harvey Course', 'MD', 'English', 6)
                         ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, school_id=EXCLUDED.school_id
                         RETURNING id`;
    const courseId = Number(cr.rows[0].id);

    // Ensure HarveyMed Organization and link
    const orgSlug = 'harveymed-organization';
    const org = await sql`INSERT INTO student_organizations (university_id, slug, name, description, website)
                          VALUES (${uniId}, ${orgSlug}, 'HarveyMed Organization', 'Student-led organization supporting Harvey Course students.', 'https://example.org/harveymed')
                          ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name
                          RETURNING id`;
    const orgId = Number(org.rows[0].id);
    await sql`INSERT INTO student_organization_schools (organization_id, school_id)
              VALUES (${orgId}, ${schoolId})
              ON CONFLICT (organization_id, school_id) DO NOTHING`;
    await sql`INSERT INTO student_organization_courses (organization_id, course_id)
              VALUES (${orgId}, ${courseId})
              ON CONFLICT (organization_id, course_id) DO NOTHING`;

    // Optionally assign current user (if authenticated) to the course & year
    let updatedUserId: number | null = null;
    if (assignToMe) {
      try {
        const session = await getServerSession(authOptions as any);
        const idRaw = Number((session as any)?.userId || 0);
        if (Number.isFinite(idRaw) && idRaw > 0) {
          await sql`UPDATE users SET university_id=${uniId}, school_id=${schoolId}, medical_course_id=${courseId}, study_year=${year} WHERE id=${idRaw}`;
          updatedUserId = idRaw;
        }
      } catch {}
    }

    // Optionally create a few demo mates and assign to same course/year
    let createdMates = 0;
    for (let i = 1; i <= mates; i++) {
      const uname = `harvey_mate_${String(i).padStart(2,'0')}`;
      const name = `Harvey Mate ${String(i).padStart(2,'0')}`;
      await sql`INSERT INTO users (username, name, university_id, school_id, medical_course_id, study_year)
                VALUES (${uname}, ${name}, ${uniId}, ${schoolId}, ${courseId}, ${year})
                ON CONFLICT (username) DO UPDATE SET university_id=EXCLUDED.university_id, school_id=EXCLUDED.school_id, medical_course_id=EXCLUDED.medical_course_id, study_year=EXCLUDED.study_year`;
      createdMates++;
    }

    return NextResponse.json({
      ok: true,
      universityId: uniId,
      schoolId,
      courseId,
      organizationId: orgId,
      updatedUserId,
      createdMates,
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}
