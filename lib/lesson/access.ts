import { sql } from "@/lib/db";

export async function isCoursePaid(courseId: number): Promise<boolean> {
  try {
    const r = await sql`SELECT visibility, COALESCE(meta->>'access','') AS access FROM courses WHERE id=${courseId} LIMIT 1`;
    const row = r.rows[0] as any;
    const isPrivate = String(row?.visibility || '').toLowerCase() === 'private';
    const access = String(row?.access || '').toLowerCase();
    return isPrivate || access === 'paid';
  } catch {
    return false;
  }
}

export async function hasCourseEntitlement(userId: number, courseId: number): Promise<boolean> {
  try {
    const r = await sql`SELECT 1 FROM user_course_entitlement WHERE user_id=${userId} AND course_id=${courseId} AND (ends_at IS NULL OR ends_at > NOW()) AND starts_at <= NOW() LIMIT 1`;
    return r.rows.length > 0;
  } catch {
    return false;
  }
}

export async function checkCourseAccess(userId: number, courseId: number): Promise<{ accessType: 'free'|'paid'; allowed: boolean }>{
  const paid = await isCoursePaid(courseId);
  if (!paid) return { accessType: 'free', allowed: true };
  if (!userId) return { accessType: 'paid', allowed: false };
  const ok = await hasCourseEntitlement(userId, courseId);
  return { accessType: 'paid', allowed: ok };
}

