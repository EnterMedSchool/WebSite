import { requireAdminEmail } from "@/lib/admin";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

async function loadPending() {
  const rows = (await sql`SELECT r.id, r.user_id, r.course_id, r.note, r.created_at, u.name, u.username, u.email
                           FROM course_moderator_requests r
                           LEFT JOIN users u ON u.id = r.user_id
                           WHERE r.status='pending'
                           ORDER BY r.created_at ASC`).rows as any[];
  return rows;
}

export default async function ModeratorRequestsPage() {
  const admin = await requireAdminEmail();
  if (!admin) return <div className="mx-auto max-w-4xl px-4 py-8"><h1 className="text-2xl font-semibold">Admin</h1><p className="mt-2 text-rose-700">Forbidden</p></div>;
  const rows = await loadPending();
  async function ApproveButton({ id }: { id: number }) {
    async function onClick() {
      'use server';
    }
    return <form action={`/api/admin/course-mates/moderators/requests/${id}/approve`} method="post"><button className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Approve</button></form>;
  }
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Moderator Applications</h1>
      <div className="mt-4 divide-y rounded-2xl border border-gray-200 bg-white">
        {rows.map((r)=> (
          <div key={r.id} className="grid grid-cols-[1fr,1fr,auto] items-center gap-4 p-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">{r.name || r.username || r.email}</div>
              <div className="text-xs text-gray-600">User #{r.user_id}</div>
            </div>
            <div className="text-sm text-gray-800">
              <div>Course #{r.course_id}</div>
              <div className="text-xs text-gray-600">{new Date(r.created_at).toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <form action={`/api/admin/course-mates/moderators/requests/${r.id}/approve`} method="post"><button className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Approve</button></form>
              <form action={`/api/admin/course-mates/moderators/requests/${r.id}/reject`} method="post"><button className="rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">Reject</button></form>
            </div>
          </div>
        ))}
        {!rows.length && <div className="p-4 text-sm text-gray-600">No pending applications.</div>}
      </div>
    </div>
  );
}

