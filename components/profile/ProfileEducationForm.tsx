"use client";

import { useEffect, useState } from "react";

type Option = { id: number; name: string; slug?: string };
type Approved = { universityId: number | null; schoolId: number | null; medicalCourseId: number | null; studyYear: number | null; isVerified: boolean };
type Pending = { id: number; universityId: number | null; schoolId: number | null; medicalCourseId: number | null; studyYear: number | null; status: string; createdAt: string } | null;

export default function ProfileEducationForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approved, setApproved] = useState<Approved>({ universityId: null, schoolId: null, medicalCourseId: null, studyYear: null, isVerified: false });
  const [pending, setPending] = useState<Pending>(null);
  const [universities, setUniversities] = useState<Option[]>([]);
  const [schools, setSchools] = useState<Option[]>([]);
  const [courses, setCourses] = useState<Option[]>([]);

  // Form state (request values)
  const [universityId, setUniversityId] = useState<number | null>(null);
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [medicalCourseId, setMedicalCourseId] = useState<number | null>(null);
  const [studyYear, setStudyYear] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/me/profile/edu', { credentials: 'include' });
      if (!r.ok) return;
      const j = await r.json();
      setApproved(j.approved);
      setPending(j.pending);
      setUniversities(j.universities || []);
      setSchools(j.schools || []);
      setCourses(j.courses || []);
      // Initialize form with pending request if any, else approved
      setUniversityId((j.pending?.universityId ?? j.approved?.universityId) || null);
      setSchoolId((j.pending?.schoolId ?? j.approved?.schoolId) || null);
      setMedicalCourseId((j.pending?.medicalCourseId ?? j.approved?.medicalCourseId) || null);
      setStudyYear((j.pending?.studyYear ?? j.approved?.studyYear) || null);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function onChange(field: string, value: number | null) {
    // Cascade resets in form state
    if (field === 'universityId') { setUniversityId(value); setSchoolId(null); setMedicalCourseId(null); }
    else if (field === 'schoolId') { setSchoolId(value); setMedicalCourseId(null); }
    else if (field === 'medicalCourseId') { setMedicalCourseId(value); }
    else if (field === 'studyYear') { setStudyYear(value); }

    setSaving(true);
    try {
      const payload = {
        universityId: field==='universityId' ? value : universityId,
        schoolId: field==='schoolId' ? value : schoolId,
        medicalCourseId: field==='medicalCourseId' ? value : medicalCourseId,
        studyYear: field==='studyYear' ? value : studyYear,
      };
      const r = await fetch('/api/me/profile/edu', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) return;
      const j = await r.json();
      setApproved(j.approved);
      setPending(j.pending);
      setUniversities(j.universities || []);
      setSchools(j.schools || []);
      setCourses(j.courses || []);
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-gray-700">Approved</div>
            <div className="mt-1 text-sm text-gray-800">
              <div>University: {labelOf(approved.universityId, universities) ?? '-'}</div>
              <div>School: {labelOf(approved.schoolId, schools) ?? '-'}</div>
              <div>Course: {labelOf(approved.medicalCourseId, courses) ?? '-'}</div>
              <div>Year: {approved.studyYear ?? '-'}</div>
              <div className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${approved.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{approved.isVerified ? 'Verified' : 'Not verified'}</div>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-700">Pending Request</div>
            <div className="mt-1 text-sm text-gray-800">
              {pending ? (
                <>
                  <div>University: {labelOf(pending.universityId, universities) ?? '-'}</div>
                  <div>School: {labelOf(pending.schoolId, schools) ?? '-'}</div>
                  <div>Course: {labelOf(pending.medicalCourseId, courses) ?? '-'}</div>
                  <div>Year: {pending.studyYear ?? '-'}</div>
                  <div className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Pending review</div>
                </>
              ) : (
                <div className="text-gray-600">No pending changes.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="University" value={universityId} options={universities} onChange={(v)=>onChange('universityId', v)} placeholder="Choose university" />
          <Select label="School" value={schoolId} options={schools} onChange={(v)=>onChange('schoolId', v)} placeholder="Choose school" disabled={!universityId} />
          <Select label="Course" value={medicalCourseId} options={courses} onChange={(v)=>onChange('medicalCourseId', v)} placeholder="Choose course" disabled={!universityId} />
          <Select label="Study Year" value={studyYear} options={[1,2,3,4,5,6].map((y)=>({ id: y, name: `Year ${y}` }))} onChange={(v)=>onChange('studyYear', v)} placeholder="Select year" disabled={!medicalCourseId} />
        </div>
        {saving && <div className="mt-2 text-xs text-gray-500">Saving…</div>}
        <div className="mt-3 text-xs text-gray-600">We will review your request. You’ll get access to Course Mates once approved.</div>
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

function labelOf(id: number | null, list: Option[]): string | null {
  if (!id) return null; const f = list.find((x)=>x.id===id); return f?.name ?? null;
}

