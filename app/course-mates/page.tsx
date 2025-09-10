"use client";

import { useEffect, useMemo, useState } from "react";

type Option = { id: number; name: string; slug?: string };
type Org = { id: number; name: string; slug: string; website?: string | null; description?: string | null };
type Mate = { id: number; name?: string | null; username?: string | null; image?: string | null };

export default function CourseMatesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [universities, setUniversities] = useState<Option[]>([]);
  const [schools, setSchools] = useState<Option[]>([]);
  const [courses, setCourses] = useState<Option[]>([]);
  const [organizations, setOrganizations] = useState<Org[]>([]);
  const [mates, setMates] = useState<Mate[]>([]);
  const [me, setMe] = useState<any>({});
  const [access, setAccess] = useState<"verified" | "pending" | "unset" | null>(null);
  const [summary, setSummary] = useState<{ matesCount: number; courseName?: string | null; schoolName?: string | null; studyYear?: number | null } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/course-mates", { credentials: "include" });
      if (r.status === 401) {
        setIsAuthed(false);
        setMe({}); setUniversities([]); setSchools([]); setCourses([]); setOrganizations([]); setMates([]);
        return;
      }
      setIsAuthed(true);
      if (!r.ok) return;
      const j = await r.json();
      setUniversities(j.universities || []);
      setSchools(j.schools || []);
      setCourses(j.courses || []);
      setOrganizations(j.organizations || []);
      setMates(j.mates || []);
      setMe(j.me || {});
      setAccess(j.access || null);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (access !== "verified") return;
    (async () => {
      try {
        const r = await fetch('/api/course-mates/summary', { credentials: 'include' });
        if (r.ok) setSummary(await r.json());
      } catch {}
    })();
  }, [access]);

  async function update(field: string, value: number | null) {
    setSaving(true);
    try {
      const next: any = {
        universityId: me.universityId ?? null,
        schoolId: me.schoolId ?? null,
        medicalCourseId: me.medicalCourseId ?? null,
        studyYear: me.studyYear ?? null,
      };
      next[field] = value;
      if (field === "universityId") { next.schoolId = null; next.medicalCourseId = null; }
      if (field === "schoolId") { next.medicalCourseId = null; }
      setMe((m: any) => ({ ...m, ...next }));
      await fetch("/api/course-mates", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
      setAccess("pending");
      try {
        const rr = await fetch('/api/me/profile/edu', { credentials: 'include' });
        if (rr.ok) {
          const pj = await rr.json();
          setUniversities(pj.universities || universities);
          setSchools(pj.schools || schools);
          setCourses(pj.courses || courses);
        }
      } catch {}
    } finally { setSaving(false); }
  }

  const initials = useMemo(() => (name?: string | null) => {
    const n = (name || "").trim();
    if (!n) return "U";
    return n.split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Your Course Mates</h1>
      <p className="text-gray-600">Connect with students from your university, school and course. Set your details to see your mates and relevant student organizations.</p>

      {!loading && isAuthed === false && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Please sign in to access Your Course Mates.
        </div>
      )}
      {!loading && isAuthed && access === "pending" && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
          Your access is pending manual verification. Update your details in <a href="/me/profile" className="font-semibold underline">Edit profile</a>.
        </div>
      )}

      {access !== "verified" && (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Select label="University" value={me.universityId ?? null} options={universities} onChange={(v)=>update("universityId", v)} placeholder="Choose university" disabled={!isAuthed} />
          <Select label="School" value={me.schoolId ?? null} options={schools} onChange={(v)=>update("schoolId", v)} placeholder="Choose school" disabled={!isAuthed || !me.universityId} />
          <Select label="Course" value={me.medicalCourseId ?? null} options={courses} onChange={(v)=>update("medicalCourseId", v)} placeholder="Choose course" disabled={!isAuthed || !me.universityId} />
          <Select label="Study Year" value={me.studyYear ?? null} options={[1,2,3,4,5,6].map((y)=>({ id: y, name: `Year ${y}` }))} onChange={(v)=>update("studyYear", v)} placeholder="Select year" disabled={!isAuthed || !me.medicalCourseId} />
        </div>
        {saving && <div className="mt-2 text-xs text-gray-500">Saving...</div>}
      </div>
      )}

      {access === "verified" && (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-fuchsia-50 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-indigo-700">Your Course</div>
              <div className="text-2xl font-extrabold text-gray-900">{summary?.courseName || 'Your Course'} <span className="text-base font-semibold text-gray-600">• {summary?.schoolName || 'School'} • Year {summary?.studyYear ?? me.studyYear ?? '-'}</span></div>
              <div className="mt-1 text-sm text-gray-600">Welcome to your course space. Discover classmates, organizations, events and more.</div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-indigo-200 bg-white px-4 py-2"><div className="text-xl font-bold text-indigo-700">{summary?.matesCount ?? 0}</div><div className="text-[11px] text-gray-600">Mates</div></div>
              <div className="rounded-xl border border-indigo-200 bg-white px-4 py-2"><div className="text-xl font-bold text-indigo-700">{organizations.length}</div><div className="text-[11px] text-gray-600">Organizations</div></div>
              <a href="/me/profile" className="grid place-items-center rounded-xl border border-indigo-200 bg-white px-4 py-2 text-[11px] font-semibold text-indigo-700">Edit Profile</a>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mates in your course</h2>
            {loading && <span className="text-xs text-gray-500">Loading...</span>}
          </div>
          {!me.medicalCourseId || !me.studyYear || access !== "verified" ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">Set your course and study year to see your mates.</div>
          ) : mates.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">No mates found yet. Invite your classmates!</div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {mates.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  {m.image ? (
                    <img src={m.image} alt={m.name || m.username || "mate"} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials(m.name || m.username)}</div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{m.name || m.username || `User #${m.id}`}</div>
                    <div className="text-xs text-gray-600">Same course • Year {me.studyYear}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold">Student Organizations</h2>
          {organizations.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">No organizations yet. They will appear once you select your university/school.</div>
          ) : (
            <ul className="space-y-2">
              {organizations.map((o) => (
                <li key={o.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="font-medium text-gray-900">{o.name}</div>
                  {o.description && <div className="mt-0.5 line-clamp-2 text-xs text-gray-600">{o.description}</div>}
                  {o.website && (
                    <a href={o.website} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-indigo-600 hover:underline">
                      Visit website
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {access === "verified" && (
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 text-lg font-semibold">Course Leaderboard (Coming Soon)</div>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[1,2,3,4,5].map((n) => (
                  <li key={n} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                    <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">#{n}</span><span className="font-medium text-gray-800">Top Student {n}</span></div>
                    <span className="text-xs text-indigo-700">{1000 - n*37} XP</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 text-lg font-semibold">Upcoming Events (Mock)</div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="rounded-lg border px-3 py-2"><div className="font-semibold">Welcome Meetup</div><div className="text-xs text-gray-600">Sep 15 • Student Center</div></li>
                <li className="rounded-lg border px-3 py-2"><div className="font-semibold">Cardio Workshop</div><div className="text-xs text-gray-600">Sep 22 • Anatomy Lab</div></li>
                <li className="rounded-lg border px-3 py-2"><div className="font-semibold">Study Night</div><div className="text-xs text-gray-600">Oct 1 • Library</div></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Select({ label, value, options, onChange, placeholder, disabled }: { label: string; value: number | null; options: Option[]; onChange: (v: number | null) => void; placeholder?: string; disabled?: boolean }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-gray-700">{label}</div>
      <select
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm disabled:bg-gray-100"
        value={String(value ?? "")}
        onChange={(e) => {
          const v = e.target.value === "" ? null : Number(e.target.value);
          onChange(v);
        }}
        disabled={disabled}
      >
        <option value="">{placeholder || "Select"}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
}



