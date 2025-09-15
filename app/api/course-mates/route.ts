export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getUniversities, getSchoolsByUniversity, getCourses } from "@/lib/course-mates/cache";
import { isCourseModerator } from "@/lib/course-mates/moderation";
import { resolveUserIdFromSession } from "@/lib/user";

export async function GET() {
  try {
    const userId = await resolveUserIdFromSession();
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const ur = await sql`SELECT id, university_id, school_id, medical_course_id, study_year, mates_verified, name, username, image FROM users WHERE id=${userId} LIMIT 1`;
    const me = ur.rows[0] || {};
    const uniId = me?.university_id || null;
    const schoolId = me?.school_id || null;
    const courseId = me?.medical_course_id || null;
    const year = me?.study_year || null;
    const isVerified = !!me?.mates_verified;

    const universities = await getUniversities();

    // Feature detection: if new tables aren't migrated yet, avoid 500s and return empty feature data
    const reg = (await sql`SELECT
        to_regclass('public.schools')                       AS schools,
        to_regclass('public.medical_school_courses')        AS msc,
        to_regclass('public.student_organizations')         AS orgs,
        to_regclass('public.student_organization_schools')  AS org_schools`).rows[0] || {} as any;
    const hasSchools = !!reg?.schools; const hasMsc = !!reg?.msc; const hasOrgs = !!reg?.orgs; const hasOrgSchools = !!reg?.org_schools;

    const schools = hasSchools && uniId ? await getSchoolsByUniversity(uniId) : [];
    const courses = hasMsc && (courseId || schoolId || uniId) ? await getCourses({ uniId, schoolId }) : [];

    // Organizations at university, optionally also linked to this school
    let orgs: any[] = [];
    if (hasOrgs && uniId) {
      if (hasOrgSchools) {
        if (schoolId) {
          const r = await sql`
            SELECT DISTINCT so.id, so.name, so.slug, so.website, so.description
            FROM student_organizations so
            LEFT JOIN student_organization_schools sos ON sos.organization_id = so.id
            WHERE so.university_id=${uniId} AND sos.school_id=${schoolId}
            ORDER BY so.name ASC`;
          orgs = r.rows;
        } else {
          const r = await sql`
            SELECT DISTINCT so.id, so.name, so.slug, so.website, so.description
            FROM student_organizations so
            LEFT JOIN student_organization_schools sos ON sos.organization_id = so.id
            WHERE so.university_id=${uniId}
            ORDER BY so.name ASC`;
          orgs = r.rows;
        }
      } else {
        const r = await sql`
          SELECT so.id, so.name, so.slug, so.website, so.description
          FROM student_organizations so
          WHERE so.university_id=${uniId}
          ORDER BY so.name ASC`;
        orgs = r.rows;
      }
    }

    // Mates: users in same course + study year
    let mates: any[] = [];
    let matesCount = 0, courseName: string | null = null, schoolName: string | null = null, activeNow = 0;
    if (false && isVerified && courseId && year) {
      const mr = await sql`
        SELECT id, name, username, image
        FROM users
        WHERE id <> \\n          AND medical_course_id=\\n          AND study_year=\\n          AND COALESCE(mates_verified, false) = true
        ORDER BY id ASC
        LIMIT 50`;
      mates = mr.rows;
    }

    // Correct mates query (executes while old block is disabled)
    if (isVerified && courseId && year) {
      try {
        const mr2 = await sql`
          SELECT id, name, username, image
          FROM users
          WHERE id <> ${userId}
            AND medical_course_id = ${courseId}
            AND study_year = ${year}
            AND COALESCE(mates_verified, false) = true
          ORDER BY id ASC
          LIMIT 50`;
        mates = mr2.rows;
        // Also compute lightweight summary used by dashboard/page
        try {
          const c = await sql`SELECT name, school_id FROM medical_school_courses WHERE id=${courseId} LIMIT 1`;
          courseName = c.rows[0]?.name ?? null;
          const sid = c.rows[0]?.school_id || null;
          if (sid) {
            const s = await sql`SELECT name FROM schools WHERE id=${sid} LIMIT 1`;
            schoolName = s.rows[0]?.name ?? null;
          }
          // Include the current user in the members count so a newly verified
          // student sees at least 1 member in their hub.
          const r = await sql`SELECT COUNT(*)::int AS n FROM users WHERE medical_course_id = ${courseId} AND study_year = ${year} AND COALESCE(mates_verified, false) = true`;
          matesCount = Number(r.rows[0]?.n || 0);
          const a = await sql`SELECT COUNT(DISTINCT e.user_id)::int AS n
                               FROM lms_events e
                               JOIN users u ON u.id = e.user_id
                               WHERE e.created_at >= now() - interval '24 hours'
                                 AND u.medical_course_id = ${courseId}
                                 AND u.study_year = ${year}
                                 AND COALESCE(u.mates_verified, false) = true`;
          activeNow = Number(a.rows[0]?.n || 0);
        } catch {}
      } catch {}
    }

    // Course settings
    let studyVibe: string | null = null;
    if (isVerified && courseId && year) {
      try {
        const r = await sql`SELECT study_vibe FROM course_mates_settings WHERE course_id=${courseId} LIMIT 1`;
        studyVibe = r.rows[0]?.study_vibe ?? null;
      } catch {}
    }

    // Moderators list (limit visibility to verified users)
    let moderators: any[] = [];
    if (isVerified && courseId && year) {
      try {
        const r = await sql`SELECT m.user_id AS id, u.name, u.username, u.image
                             FROM course_mates_moderators m
                             LEFT JOIN users u ON u.id = m.user_id
                             WHERE m.course_id=${courseId}
                             ORDER BY u.name NULLS LAST, u.username NULLS LAST`;
        moderators = r.rows;
      } catch {}
    }

    // Feed posts (only for verified users)
    let feed: any[] = [];
    if (isVerified && courseId && year) {
      try {
        const r = await sql`SELECT p.id, p.content, p.created_at, u.name, u.username, u.image
                             FROM course_feed_posts p
                             LEFT JOIN users u ON u.id = p.user_id
                             WHERE p.course_id=${courseId}
                             ORDER BY p.created_at DESC
                             LIMIT 10`;
        feed = r.rows;
      } catch {}
    }

    // Upcoming events (only for verified users)
    let events: any[] = [];
    if (isVerified && courseId && year) {
      try {
        const r = await sql`SELECT id, title, start_at, end_at, location
                             FROM course_events
                             WHERE course_id=${courseId} AND start_at >= now() - interval '1 day'
                             ORDER BY start_at ASC
                             LIMIT 6`;
        events = r.rows;
      } catch {}
    }

    // Recent photos (only for verified users)
    let photos: any[] = [];
    if (isVerified && courseId && year) {
      try {
        const r = await sql`SELECT p.id, p.url, p.caption
                             FROM course_event_photos p
                             WHERE p.event_id IN (
                               SELECT id FROM course_events WHERE course_id=${courseId} ORDER BY start_at DESC LIMIT 50
                             )
                             ORDER BY p.created_at DESC
                             LIMIT 9`;
        photos = r.rows;
      } catch {}
    }

    const isModerator = courseId ? await isCourseModerator(userId, courseId) : false;

    return NextResponse.json({
      me: {
        id: me?.id, name: me?.name, username: me?.username, image: me?.image,
        universityId: uniId, schoolId, medicalCourseId: courseId, studyYear: year, isVerified,
      },
      universities,
      schools,
      courses,
      organizations: orgs,
      mates,
      access: isVerified ? 'verified' : (courseId && year ? 'pending' : 'unset'),
      summary: isVerified ? { matesCount, courseName, schoolName, studyYear: year ?? null, activeNow } : null,
      settings: { studyVibe },
      moderators,
      feed,
      events,
      photos,
      isModerator,
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

    // Privacy-first: do NOT set users.* directly. Create/update a pending request instead.
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
    return NextResponse.json({ ok: true, pending: true });
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}

