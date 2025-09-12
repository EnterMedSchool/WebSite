"use client";

import { useEffect, useState } from "react";

export default function ModeratorsClient({ initialRows }: { initialRows: any[] }) {
  const [rows, setRows] = useState<any[]>(initialRows);
  const [busy, setBusy] = useState(false);
  const [courseId, setCourseId] = useState<number | ''>('');
  const [userId, setUserId] = useState<number | ''>('');

  async function refresh() {
    try {
      const r = await fetch('/api/admin/course-mates/moderators', { credentials: 'include' });
      if (r.ok) setRows((await r.json())?.data || []);
    } catch {}
  }

  async function add() {
    if (!courseId || !userId) return;
    setBusy(true);
    try {
      await fetch('/api/admin/course-mates/moderators', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: Number(courseId), userId: Number(userId) })
      });
      await refresh(); setUserId('');
    } finally { setBusy(false); }
  }

  async function remove(c: number, u: number) {
    setBusy(true);
    try {
      await fetch('/api/admin/course-mates/moderators', {
        method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: c, userId: u })
      });
      await refresh();
    } finally { setBusy(false); }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-lg font-semibold">Add Moderator</div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="block">
            <div className="mb-1 text-xs font-semibold text-gray-700">Course ID</div>
            <input value={courseId} onChange={(e)=>setCourseId(e.target.value===''? '' : Number(e.target.value))} className="w-40 rounded border px-2 py-1 text-sm" placeholder="course_id" />
          </label>
          <label className="block">
            <div className="mb-1 text-xs font-semibold text-gray-700">User ID</div>
            <input value={userId} onChange={(e)=>setUserId(e.target.value===''? '' : Number(e.target.value))} className="w-40 rounded border px-2 py-1 text-sm" placeholder="user_id" />
          </label>
          <button onClick={add} disabled={busy || !courseId || !userId} className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Add</button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-2 text-lg font-semibold">Current Moderators</div>
        <div className="divide-y">
          {rows.map((r: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-semibold text-gray-900">Course #{r.course_id}</div>
                <div className="text-xs text-gray-600">User #{r.user_id} — {r.name || r.username || r.email}</div>
              </div>
              <button onClick={()=>remove(r.course_id, r.user_id)} disabled={busy} className="rounded bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Remove</button>
            </div>
          ))}
          {!rows.length && <div className="py-4 text-sm text-gray-600">No moderators yet.</div>}
        </div>
      </div>
    </div>
  );
}

