import { sql } from "@/lib/db";
import { requireAdminEmail } from "@/lib/admin";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

async function getPending() {
  const r = await sql`
    SELECT r.id,
           r.user_id,
           u.email,
           u.name,
           r.university_id,
           un.name AS university_name,
           r.school_id,
           s.name  AS school_name,
           r.medical_course_id,
           msc.name AS course_name,
           r.study_year,
           r.created_at
    FROM user_education_requests r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN universities un ON un.id = r.university_id
    LEFT JOIN schools s ON s.id = r.school_id
    LEFT JOIN medical_school_courses msc ON msc.id = r.medical_course_id
    WHERE r.status = 'pending'
    ORDER BY r.created_at ASC`;
  return r.rows as any[];
}

export default async function AdminCourseMatesPage() {
  const admin = await requireAdminEmail();
  if (!admin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-rose-700">Forbidden: your account is not authorized.</p>
      </div>
    );
  }
  const rows = await getPending();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Course Mates — Pending Requests</h1>
      <p className="mt-1 text-sm text-gray-600">Signed in as {admin.email}. Approve only verified students. Changes apply immediately.</p>
      <AdminClient initialRows={rows} />
    </div>
  );
}
