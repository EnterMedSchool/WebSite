import { sql } from "@/lib/db";
import { requireAdminEmail } from "@/lib/admin";

export async function isCourseModerator(userId: number, courseId: number): Promise<boolean> {
  if (!userId || !courseId) return false;
  try {
    const admin = await requireAdminEmail();
    if (admin) return true; // site admins moderate all hubs
  } catch {}
  try {
    const r = await sql`SELECT 1 FROM course_mates_moderators WHERE user_id=${userId} AND course_id=${courseId} LIMIT 1`;
    return !!r.rows[0];
  } catch {
    return false;
  }
}
