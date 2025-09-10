"use client";

import { useState } from "react";

export default function AdminClient({ initialRows }: { initialRows: any[] }) {
  const [rows, setRows] = useState<any[]>(initialRows);
  const [busy, setBusy] = useState<number | null>(null);
  async function refresh() {
    try {
      const r = await fetch('/api/admin/course-mates/requests', { credentials: 'include' });
      if (r.ok) setRows((await r.json())?.data || []);
    } catch {}
  }
  async function approve(id: number) {
    setBusy(id);
    try { await fetch(`/api/admin/course-mates/requests/${id}/approve`, { method: 'POST', credentials: 'include' }); } finally { setBusy(null); await refresh(); }
  }
  async function reject(id: number) {
    const note = window.prompt('Rejection note (optional)') || '';
    setBusy(id);
    try { await fetch(`/api/admin/course-mates/requests/${id}/reject`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) }); } finally { setBusy(null); await refresh(); }
  }
  if (!rows.length) return <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 text-gray-600">No pending requests.</div>;
  return (
    <div className="mt-6 divide-y rounded-2xl border border-gray-200 bg-white">
      {rows.map((r) => (
        <div key={r.id} className="grid grid-cols-[1fr,1fr,1fr,auto] items-center gap-4 p-4">
          <div>
            <div className="text-sm font-semibold text-gray-900">{r.name || r.email}</div>
            <div className="text-xs text-gray-600">User #{r.user_id}</div>
          </div>
          <div className="text-sm text-gray-800">
            <div>{r.university_name || '-'} </div>
            <div className="text-xs text-gray-600">{r.school_name || '-'}</div>
          </div>
          <div className="text-sm text-gray-800">
            <div>{r.course_name || '-'}</div>
            <div className="text-xs text-gray-600">Year {r.study_year ?? '-'}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => approve(r.id)} disabled={busy===r.id} className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">Approve</button>
            <button onClick={() => reject(r.id)} disabled={busy===r.id} className="rounded-md bg-rose-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50">Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}

