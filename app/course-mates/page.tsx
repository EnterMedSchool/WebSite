"use client";

import { useEffect, useMemo, useState } from "react";

type Option = { id: number; name: string; slug?: string };
type Org = { id: number; name: string; slug: string; website?: string | null; description?: string | null };
type Mate = { id: number; name?: string | null; username?: string | null; image?: string | null };

export default function CourseMatesPage() {
  const [Loading... setLoading... = useState(true);
  const [Saving... setSaving... = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [universities, setUniversities] = useState<Option[]>([]);
  const [schools, setSchools] = useState<Option[]>([]);
  const [courses, setCourses] = useState<Option[]>([]);
  const [organizations, setOrganizations] = useState<Org[]>([]);
  const [mates, setMates] = useState<Mate[]>([]);
  const [me, setMe] = useState<any>({});
  const [access, setAccess] = useState<"verified" | "pending" | "unset" | null>(null);

  async function load() {
    setLoading...true);
    try {
      const r = await fetch('/api/course-mates', { credentials: 'include' });
      if (r.status === 401) { setIsAuthed(false); setMe({}); setUniversities([]); setSchools([]); setCourses([]); setOrganizations([]); setMates([]); return; }
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
    } finally { setLoading...false); }
  }

  useEffect(() => { load(); }, []);

  async function update(field: string, value: number | null) {
    setSaving...true);
    try {
      const payload: any = {
        universityId: me.universityId ?? null,
        schoolId: me.schoolId ?? null,
        medicalCourseId: me.medicalCourseId ?? null,
        studyYear: me.studyYear ?? null,
      };
      payload[field] = value;
      // If upstream changes, cascade reset children to keep integrity
      if (field === 'universityId') { payload.schoolId = null; payload.medicalCourseId = null; }
      if (field === 'schoolId') { payload.medicalCourseId = null; }
      const r = await fetch('/api/course-mates', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (r.ok) {
        const j = await r.json();
        setUniversities(j.universities || []);
        setSchools(j.schools || []);
        setCourses(j.courses || []);
        setOrganizations(j.organizations || []);
        setMates(j.mates || []);
        setMe(j.me || {});
      }
    } finally { setSaving...false); }
  }

  const initials = useMemo(() => (name?: string | null) => {
    const n = (name || '').trim();
    if (!n) return 'U';
    return n.split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Your Course Mates</h1>
      <p className="text-gray-600">Connect with students from your university, school and course. Set your details to see your mates and relevant student organizations.</p>

      {!Loading...&& isAuthed === false && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Please sign in to access Your Course Mates.
        </div>
      )}
      {!Loading...&& isAuthed && access === 'pending' && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
          Your access is pending manual verification. Update your details in <a href="/me/profile" className="font-semibold underline">Edit profile</a>.
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Select
            label="University"
            value={me.universityId ?? null}
            options={universities}
            onChange={(v)=>update('universityId', v)}
            placeholder="Choose university"
            disabled={access !== 'verified'}
          />
          <Select
            label="School"
            value={me.schoolId ?? null}
            options={schools}
            onChange={(v)=>update('schoolId', v)}
            placeholder="Choose school"
            disabled={!me.universityId || access !== 'verified'}
          />
          <Select
            label="Course"
            value={me.medicalCourseId ?? null}
            options={courses}
            onChange={(v)=>update('medicalCourseId', v)}
            placeholder="Choose course"
            disabled={!me.universityId || access !== 'verified'}
          />
          <Select
            label="Study Year"
            value={me.studyYear ?? null}
            options={[1,2,3,4,5,6].map((y)=>({ id: y, name: `Year ${y}` }))}
            onChange={(v)=>update('studyYear', v)}
            placeholder="Select year"
            disabled={!me.medicalCourseId || access !== 'verified'}
          />
        </div>
        {saving && <div className="mt-2 text-xs text-gray-500">Saving...</div>}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mates in your course</h2>
            {loading && <span className="text-xs text-gray-500">Loading...</span>}
            {loading && <span className="text-xs text-gray-500">Loading...</span>}
          {!me.medicalCourseId || !me.studyYear || access !== "verified" ? (
          ) : mates.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">No mates found yet. Invite your classmates!</div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {mates.map((m)=> (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  {m.image ? (
                    <img src={m.image} alt={m.name || m.username || 'mate'} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials(m.name || m.username)}</div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{m.name || m.username || `User #${m.id}`}</div>
                    <div className="text-xs text-gray-600">Same course ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Year {me.studyYear}</div>
                    <div className="text-xs text-gray-600">Same course â€¢ Year {me.studyYear}</div>
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
              {organizations.map((o)=> (
                <li key={o.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="font-medium text-gray-900">{o.name}</div>
                  {o.description && <div className="mt-0.5 line-clamp-2 text-xs text-gray-600">{o.description}</div>}
                  {o.website && <a href={o.website} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-indigo-600 hover:underline">Visit website</a>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Select({ label, value, options, onChange, placeholder, disabled }: { label: string; value: number | null; options: Option[]; onChange: (v: number | null) => void; placeholder?: string; disabled?: boolean }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold text-gray-700">{label}</div>
      <select
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm disabled:bg-gray-100"
        value={String(value ?? '')}
        onChange={(e)=>{
          const v = e.target.value === '' ? null : Number(e.target.value);
          onChange(v);
        }}
        disabled={disabled}
      >
        <option value="">{placeholder || 'Select'}</option>
        {options.map((o)=> (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </label>
  );
}
