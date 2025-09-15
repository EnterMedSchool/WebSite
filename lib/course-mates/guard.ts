import { sql } from "@/lib/db";

export type VerifiedCourseContext = {
  courseId: number;
  studyYear: number;
};

// Returns { courseId, studyYear } only when the user is verified and has a course/year set.
// Returns null otherwise (not authed in caller, not verified, or missing course/year).
export async function verifiedCourseForUser(userId: number): Promise<VerifiedCourseContext | null> {
  try {
    if (!userId || !Number.isFinite(userId)) return null;
    const me = (await sql`SELECT medical_course_id, study_year, mates_verified FROM users WHERE id=${userId} LIMIT 1`).rows[0] || {};
    const cid = Number(me?.medical_course_id || 0);
    const yr = Number(me?.study_year || 0);
    const isVerified = !!me?.mates_verified;
    if (!isVerified || !cid || !yr) return null;
    return { courseId: cid, studyYear: yr };
  } catch {
    return null;
  }
}

