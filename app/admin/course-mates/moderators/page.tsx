import { requireAdminEmail } from "@/lib/admin";
import { sql } from "@/lib/db";
import ModeratorsClient from "./ModeratorsClient";

export const dynamic = "force-dynamic";

async function loadAll() {
  const rows = (await sql`SELECT m.course_id, m.user_id, u.name, u.username, u.email
                          FROM course_mates_moderators m
                          LEFT JOIN users u ON u.id = m.user_id
                          ORDER BY m.course_id ASC, u.name NULLS LAST`).rows as any[];
  return rows;
}

export default async function ModeratorsPage() {
  const admin = await requireAdminEmail();
  if (!admin) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-rose-700">Forbidden</p>
      </div>
    );
  }
  const rows = await loadAll();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Course Mates — Moderators</h1>
      <p className="mt-1 text-sm text-gray-600">Signed in as {admin.email}. Add or remove course moderators.</p>
      <ModeratorsClient initialRows={rows} />
    </div>
  );
}

