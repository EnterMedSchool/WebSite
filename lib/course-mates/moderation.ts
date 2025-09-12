import { sql } from "@/lib/db";

export async function isCourseModerator(userId: number, courseId: number): Promise<boolean> {
  if (!userId || !courseId) return false;
  try {
    const r = await sql`SELECT 1 FROM course_mates_moderators WHERE user_id=${userId} AND course_id=${courseId} LIMIT 1`;
    return !!r.rows[0];
  } catch {
    return false;
  }
}

