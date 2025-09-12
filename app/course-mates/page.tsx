import CourseMatesClient from './CourseMatesClient';
import { resolveUserIdFromSession } from '@/lib/user';
import { sql } from '@/lib/db';
import { getUniversities, getSchoolsByUniversity, getCourses } from '@/lib/course-mates/cache';
import { isCourseModerator, isUniversityModerator } from '@/lib/course-mates/moderation';
import { requireAdminEmail } from '@/lib/admin';

export default async function CourseMatesPage() {
  const userId = await resolveUserIdFromSession();
  if (!userId) {
    return (
      <CourseMatesClient
        authed={false}
        initial={{
          universities: [], schools: [], courses: [], organizations: [], mates: [], me: {},
          access: 'unset', summary: null, studyVibe: null, isModerator: false,
          feed: [], events: [], photos: [], moderators: []
        }}
      />
    );
  }

  const ur = await sql`SELECT id, university_id, school_id, medical_course_id, study_year, mates_verified, name, username, image FROM users WHERE id=${userId} LIMIT 1`;
  const me = ur.rows[0] || {} as any;
  const uniId = me?.university_id || null;
  const schoolId = me?.school_id || null;
  const courseId = me?.medical_course_id || null;
  const year = me?.study_year || null;
  const isVerified = !!me?.mates_verified;

  const universities = await getUniversities();

  const reg = (await sql`SELECT
      to_regclass('public.schools')                       AS schools,
      to_regclass('public.medical_school_courses')        AS msc,
      to_regclass('public.student_organizations')         AS orgs,
      to_regclass('public.student_organization_schools')  AS org_schools`).rows[0] || ({} as any);
  const hasSchools = !!(reg as any)?.schools; const hasMsc = !!(reg as any)?.msc; const hasOrgs = !!(reg as any)?.orgs; const hasOrgSchools = !!(reg as any)?.org_schools;

  const schools = hasSchools && uniId ? await getSchoolsByUniversity(uniId) : [];
  const courses = hasMsc && (courseId || schoolId || uniId) ? await getCourses({ uniId, schoolId }) : [];

  let organizations: any[] = [];
  if (hasOrgs && uniId) {
    if (hasOrgSchools) {
      if (schoolId) {
        const r = await sql`
          SELECT DISTINCT so.id, so.name, so.slug, so.website, so.description
          FROM student_organizations so
          LEFT JOIN student_organization_schools sos ON sos.organization_id = so.id
          WHERE so.university_id=${uniId} AND sos.school_id=${schoolId}
          ORDER BY so.name ASC`;
        organizations = r.rows;
      } else {
        const r = await sql`
          SELECT DISTINCT so.id, so.name, so.slug, so.website, so.description
          FROM student_organizations so
          LEFT JOIN student_organization_schools sos ON sos.organization_id = so.id
          WHERE so.university_id=${uniId}
          ORDER BY so.name ASC`;
        organizations = r.rows;
      }
    } else {
      const r = await sql`
        SELECT so.id, so.name, so.slug, so.website, so.description
        FROM student_organizations so
        WHERE so.university_id=${uniId}
        ORDER BY so.name ASC`;
      organizations = r.rows;
    }
  }

  let matesCount = 0, courseName: string | null = null, schoolName: string | null = null, activeNow = 0;
  if (courseId && year) {
    try {
      const c = await sql`SELECT name, school_id FROM medical_school_courses WHERE id=${courseId} LIMIT 1`;
      courseName = c.rows[0]?.name ?? null;
      const sid = c.rows[0]?.school_id || null;
      if (sid) { const s = await sql`SELECT name FROM schools WHERE id=${sid} LIMIT 1`; schoolName = s.rows[0]?.name ?? null; }
      // Include the current user in the members count so a newly verified
      // student sees at least 1 member in their hub.
      const r = await sql`SELECT COUNT(*)::int AS n FROM users WHERE medical_course_id = ${courseId} AND study_year = ${year} AND COALESCE(mates_verified, false) = true`;
      matesCount = Number(r.rows[0]?.n || 0);
      const a = await sql`SELECT COUNT(DISTINCT e.user_id)::int AS n FROM lms_events e JOIN users u ON u.id = e.user_id WHERE e.created_at >= now() - interval '24 hours' AND u.medical_course_id = ${courseId} AND u.study_year = ${year} AND COALESCE(u.mates_verified, false) = true`;
      activeNow = Number(a.rows[0]?.n || 0);
    } catch {}
  }

  let studyVibe: string | null = null;
  if (courseId) {
    try { const r = await sql`SELECT study_vibe FROM course_mates_settings WHERE course_id=${courseId} LIMIT 1`; studyVibe = r.rows[0]?.study_vibe ?? null; } catch {}
  }
  let moderators: any[] = [];
  if (courseId) {
    try { const r = await sql`SELECT m.user_id AS id, u.name, u.username, u.image FROM course_mates_moderators m LEFT JOIN users u ON u.id = m.user_id WHERE m.course_id=${courseId} ORDER BY u.name NULLS LAST, u.username NULLS LAST`; moderators = r.rows; } catch {}
  }
  let feed: any[] = [];
  if (courseId) {
    try { const r = await sql`SELECT p.id, p.content, p.created_at, u.name, u.username, u.image FROM course_feed_posts p LEFT JOIN users u ON u.id = p.user_id WHERE p.course_id=${courseId} ORDER BY p.created_at DESC LIMIT 10`; feed = r.rows; } catch {}
  }
  let events: any[] = [];
  if (courseId) {
    try { const r = await sql`SELECT id, title, start_at, end_at, location FROM course_events WHERE course_id=${courseId} AND start_at >= now() - interval '1 day' ORDER BY start_at ASC LIMIT 6`; events = r.rows; } catch {}
  }
  let photos: any[] = [];
  if (courseId) {
    try { const r = await sql`SELECT p.id, p.url, p.thumb_url, p.caption FROM course_event_photos p WHERE p.event_id IN (SELECT id FROM course_events WHERE course_id=${courseId} ORDER BY start_at DESC LIMIT 50) ORDER BY p.created_at DESC LIMIT 9`; photos = r.rows; } catch {}
  }

  let modRequestPending = false;
  if (courseId) {
    try { const r = await sql`SELECT 1 FROM course_moderator_requests WHERE user_id=${userId} AND course_id=${courseId} AND status='pending' LIMIT 1`; modRequestPending = !!r.rows[0]; } catch {}
  }

  // University representatives
  let uniModerators: any[] = [];
  let uniModRequestPending = false;
  let isUniModerator = false;
  if (uniId) {
    try { const r = await sql`SELECT m.user_id AS id, u.name, u.username, u.image FROM university_moderators m LEFT JOIN users u ON u.id = m.user_id WHERE m.university_id=${uniId} ORDER BY u.name NULLS LAST, u.username NULLS LAST`; uniModerators = r.rows; } catch {}
    try { const r = await sql`SELECT 1 FROM university_moderator_requests WHERE user_id=${userId} AND university_id=${uniId} AND status='pending' LIMIT 1`; uniModRequestPending = !!r.rows[0]; } catch {}
    isUniModerator = await isUniversityModerator(userId, uniId);
  }

  const initial = {
    universities,
    schools,
    courses,
    organizations,
    mates: [] as any[],
    me: { id: me?.id, name: me?.name, username: me?.username, image: me?.image, universityId: uniId, schoolId, medicalCourseId: courseId, studyYear: year, isVerified },
    access: isVerified ? 'verified' as const : (courseId && year ? 'pending' as const : 'unset' as const),
    summary: isVerified ? { matesCount, courseName, schoolName, studyYear: year ?? null, activeNow } : null,
    studyVibe,
    isModerator: courseId ? await isCourseModerator(userId, courseId) : false,
    // Pass admin flag to control admin-only actions in the client UI
    isAdmin: (await requireAdminEmail()) ? true : false,
    feed,
    events,
    photos,
    moderators,
    modRequestPending,
    uniModerators,
    uniModRequestPending,
    isUniModerator,
  };

  return <CourseMatesClient authed={true} initial={initial} />;
}
