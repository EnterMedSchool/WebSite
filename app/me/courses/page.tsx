"use client";

import { useEffect, useMemo, useState } from "react";

type Course = { id: number; slug: string; title: string; description?: string | null };

export default function RelevantCoursesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/me/relevant-courses', { credentials: 'include' });
      if (!r.ok) { setCourses([]); setSelected([]); return; }
      const j = await r.json();
      setCourses(j.courses || []);
      setSelected(Array.isArray(j.selected) ? j.selected : []);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    try {
      await fetch('/api/me/relevant-courses', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseIds: selected }) });
    } finally { setSaving(false); }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(c => c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [query, courses]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Your Relevant Courses</h1>
      <p className="text-gray-600">Choose which courses on Medmap are relevant to you. We show these on your dashboard and let you keep track of progress.</p>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <input value={query} onChange={(e)=>setQuery(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Search courses" />
          <button disabled={saving} onClick={save} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {(loading ? new Array(6).fill(null) : filtered).map((c: Course | null, i: number) => (
            <label key={c ? c.id : i} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 hover:bg-gray-50">
              <input
                type="checkbox"
                className="mt-1"
                disabled={!c}
                checked={!!c && selected.includes(c.id)}
                onChange={(e)=>{
                  if (!c) return;
                  setSelected((prev)=> e.target.checked ? Array.from(new Set([...prev, c.id])) : prev.filter(id => id !== c.id));
                }}
              />
              <div className="min-w-0">
                <div className="truncate font-semibold">{c ? c.title : <span className="inline-block h-4 w-40 animate-pulse rounded bg-gray-200" />}</div>
                <div className="truncate text-xs text-gray-600">{c ? (c.description || '-') : <span className="inline-block h-3 w-28 animate-pulse rounded bg-gray-100" />}</div>
              </div>
            </label>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="rounded-xl border p-3 text-sm text-gray-600">No courses match your search.</div>
          )}
        </div>
      </div>
    </div>
  );
}

