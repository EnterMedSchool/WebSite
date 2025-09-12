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
      setSummary(j.summary || null);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);
  

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

      {/* Removed the old signed-out alert; the preview hub has its own CTA overlay */}

      {/* Signed-out preview: show a fake hub with CTA overlay */}
      {!loading && isAuthed === false && (
        <div className="relative">
          <div className="mt-6 space-y-6 opacity-90">
            <div className="overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow-md">
              <div className="relative px-6 py-8 sm:px-8">
                <div className="absolute inset-0 opacity-20 [background:radial-gradient(ellipse_at_top_left,white_0%,transparent_60%),radial-gradient(ellipse_at_bottom_right,white_0%,transparent_60%)]" />
                <div className="relative">
                  <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-white/80">Course Hub</div>
                      <h2 className="mt-1 text-2xl font-extrabold leading-tight text-white sm:text-3xl">Your Course</h2>
                      <div className="mt-1 text-sm text-indigo-100">All years</div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-indigo-100">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 font-semibold text-white backdrop-blur">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                          128 members
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 font-semibold text-white backdrop-blur">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                          Community growing
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:flex w-full flex-wrap items-center gap-2 sm:w-auto">
                      <span className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/30">Share photo</span>
                      <span className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/30">Create event</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-lg font-semibold">Highlights</div>
                    <span className="text-xs font-semibold text-indigo-700">See feed</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/60 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Active now</div>
                      <div className="mt-1 text-2xl font-extrabold text-indigo-900">12</div>
                      <div className="text-xs text-indigo-800/80">classmates online</div>
                    </div>
                    <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Study vibe</div>
                      <div className="mt-1 text-2xl font-extrabold text-emerald-900">Calm & Focused</div>
                      <div className="text-xs text-emerald-800/80">based on recent activity</div>
                    </div>
                    <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">This week</div>
                      <div className="mt-1 text-2xl font-extrabold text-amber-900">8,420 XP</div>
                      <div className="text-xs text-amber-800/80">earned by the course</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 text-lg font-semibold">Course Feed</div>
                  <ul className="space-y-3">
                    {[{user:'Alex', text:'Your course feed will appear here.', time:'2h ago'}, {user:'Priya', text:'Events, resources and photos – everything in one place.', time:'1d ago'}].map((p, i) => (
                      <li key={i} className="rounded-xl border border-gray-200 p-3">
                        <div className="flex items-start gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials(p.user)}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-gray-900">{p.user}</div>
                              <div className="text-xs text-gray-500">{p.time}</div>
                            </div>
                            <div className="mt-1 text-sm text-gray-800">{p.text}</div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 text-lg font-semibold">Photos from Events</div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {['Welcome','Workshop','Study Night','Seminar','Meetup','Outreach'].map((t,i)=> (
                      <div key={i} className="aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-indigo-200 to-fuchsia-300 ring-1 ring-black/5">
                        <div className="flex h-full items-end bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.35),transparent_40%)] p-2">
                          <span className="rounded bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-gray-800 shadow">{t}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 text-lg font-semibold">Leaderboard</div>
                  <ul className="space-y-1 text-sm">
                    {[1,2,3,4,5].map((n) => (
                      <li key={n} className="flex items-center justify-between rounded-lg border px-3 py-1.5">
                        <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">#{n}</span><span className="font-medium text-gray-800">Top Student {n}</span></div>
                        <span className="text-xs text-indigo-700">{1100 - n*41} XP</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 text-lg font-semibold">Upcoming Events</div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div>
                        <div className="font-semibold">Welcome Meetup</div>
                        <div className="text-xs text-gray-600">Sep 15 • Student Center</div>
                      </div>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">Remind me</span>
                    </li>
                    <li className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div>
                        <div className="font-semibold">Cardio Workshop</div>
                        <div className="text-xs text-gray-600">Sep 22 • Anatomy Lab</div>
                      </div>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">Interested</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Overlay CTA */}
          <div className="pointer-events-auto absolute inset-0 z-10 grid place-items-center bg-white/70 backdrop-blur-[1.5px]">
            <div className="max-w-lg rounded-2xl border border-indigo-200 bg-white/95 p-6 text-center shadow-xl">
              <div className="text-lg font-extrabold text-gray-900">Sign in to access your Course Hub</div>
              <div className="mt-1 text-sm text-gray-700">See classmates, events, photos, leaderboards and more — tailored to your course.</div>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button onClick={() => window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode: 'signin' } }))} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700">Sign in</button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('auth:open', { detail: { mode: 'signup' } }))} className="rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Create free account</button>
              </div>
              <div className="mt-2 text-xs text-gray-500">It takes under a minute — then choose your university and course.</div>
            </div>
          </div>
        </div>
      )}
      {!loading && isAuthed && access === "pending" && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800">
          Your access is pending manual verification. Update your details in <a href="/me/profile" className="font-semibold underline">Edit profile</a>.
        </div>
      )}

      {isAuthed && access === "unset" && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
          Set your university, school, course and study year in <a href="/me/profile" className="font-semibold underline">Edit profile</a> to unlock your Course Hub.
        </div>
      )}

      {/* Removed the small verified header strip; the full hub below is the main view */}

      {/* Removed the mates list + organizations blocks per new UX */}
      {(access === "verified" || access === "pending") && (
        <div className="mt-6 space-y-6">
          {access === 'pending' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Preview while verification is pending. Some info is mocked until approved.
            </div>
          )}
          {/* Hero / Header */}
          <div className="overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow-md">
            <div className="relative px-6 py-8 sm:px-8">
              <div className="absolute inset-0 opacity-20 [background:radial-gradient(ellipse_at_top_left,white_0%,transparent_60%),radial-gradient(ellipse_at_bottom_right,white_0%,transparent_60%)]" />
              <div className="relative">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/80">Course Hub</div>
                    <h2 className="mt-1 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                      {summary?.courseName || 'Your Course'}
                    </h2>
                    <div className="mt-1 text-sm text-indigo-100">
                      {summary?.schoolName ? (
                        <span>{summary.schoolName} • All years</span>
                      ) : (
                        <span>All years</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-indigo-100">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 font-semibold text-white backdrop-blur">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        {summary?.matesCount ?? 0} members
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 font-semibold text-white backdrop-blur">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                        Community growing
                      </span>
                    </div>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <button className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-indigo-100 text-indigo-700">+</span>
                      Post update
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/25">
                      Share photo
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/25">
                      Create event
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-indigo-100/90">
                  {['Overview','Feed','Leaderboard','Photos','Events','Resources'].map((t, i) => (
                    <a key={i} href={`#${t.toLowerCase()}`} className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/15">{t}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div className="grid gap-6 lg:grid-cols-3" id="overview">
            {/* Left / Main content */}
            <div className="space-y-6 lg:col-span-2">
              {/* Course Highlights */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-lg font-semibold">Highlights</div>
                  <a href="#feed" className="text-xs font-semibold text-indigo-700 hover:underline">See feed</a>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/60 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Active now</div>
                    <div className="mt-1 text-2xl font-extrabold text-indigo-900">12</div>
                    <div className="text-xs text-indigo-800/80">classmates online</div>
                  </div>
                  <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Study vibe</div>
                    <div className="mt-1 text-2xl font-extrabold text-emerald-900">Calm & Focused</div>
                    <div className="text-xs text-emerald-800/80">based on recent activity</div>
                  </div>
                  <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">This week</div>
                    <div className="mt-1 text-2xl font-extrabold text-amber-900">8,420 XP</div>
                    <div className="text-xs text-amber-800/80">earned by the course</div>
                  </div>
                </div>
              </div>

              {/* Course Feed (mock) */}
              <div id="feed" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 text-lg font-semibold">Course Feed</div>
                <ul className="space-y-3">
                  {[{
                    user: 'Alex M', text: 'We just finished the cardio block – drop your best resources below! ❤️', time: '2h ago', likes: 24, comments: 8
                  },{
                    user: 'Priya', text: 'Mock MCQ set for neuro made – happy to share on Friday.', time: '1d ago', likes: 15, comments: 3
                  },{
                    user: 'Luca', text: 'Photos from last week’s suturing workshop looked awesome. Next one soon?', time: '3d ago', likes: 31, comments: 10
                  }].map((p, i) => (
                    <li key={i} className="rounded-xl border border-gray-200 p-3">
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials(p.user)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900">{p.user}</div>
                            <div className="text-xs text-gray-500">{p.time}</div>
                          </div>
                          <div className="mt-1 text-sm text-gray-800">{p.text}</div>
                          <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                            <button className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 ring-1 ring-gray-200">❤️ {p.likes}</button>
                            <button className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 ring-1 ring-gray-200">💬 {p.comments}</button>
                            <button className="ml-auto inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 font-semibold text-indigo-700 ring-1 ring-indigo-200">Save</button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Events + Calendar (mock) */}
              <div id="events" className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 text-lg font-semibold">Upcoming Events</div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div>
                        <div className="font-semibold">Welcome Meetup</div>
                        <div className="text-xs text-gray-600">Sep 15 • Student Center</div>
                      </div>
                      <button className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">Remind me</button>
                    </li>
                    <li className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div>
                        <div className="font-semibold">Cardio Workshop</div>
                        <div className="text-xs text-gray-600">Sep 22 • Anatomy Lab</div>
                      </div>
                      <button className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">Interested</button>
                    </li>
                    <li className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div>
                        <div className="font-semibold">Study Night</div>
                        <div className="text-xs text-gray-600">Oct 1 • Library</div>
                      </div>
                      <button className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">Join</button>
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 text-lg font-semibold">Mini Calendar</div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {['S','M','T','W','T','F','S'].map((d) => (
                      <div key={d} className="py-1 font-semibold text-gray-600">{d}</div>
                    ))}
                    {/* Sep static layout */}
                    {[
                      '', '', 1, 2, 3, 4, 5,
                      6, 7, 8, 9, 10, 11, 12,
                      13, 14, 15, 16, 17, 18, 19,
                      20, 21, 22, 23, 24, 25, 26,
                      27, 28, 29, 30, '', '',
                    ].map((n, i) => (
                      <div key={i} className={`grid h-8 place-items-center rounded ${n ? 'bg-gray-50 text-gray-700 ring-1 ring-gray-200' : ''}`}>
                        <div className="relative">
                          <span className="text-[11px]">{n || ''}</span>
                          {(n === 15 || n === 22 || n === 1) && <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Photo Gallery (mock) */}
              <div id="photos" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-lg font-semibold">Photos from Events</div>
                  <a href="#photos" className="text-xs font-semibold text-indigo-700 hover:underline">View all</a>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { c: 'from-indigo-200 to-indigo-400', t: 'Welcome' },
                    { c: 'from-emerald-200 to-emerald-400', t: 'Workshop' },
                    { c: 'from-amber-200 to-amber-400', t: 'Study Night' },
                    { c: 'from-fuchsia-200 to-fuchsia-400', t: 'Seminar' },
                    { c: 'from-sky-200 to-sky-400', t: 'Meetup' },
                    { c: 'from-rose-200 to-rose-400', t: 'Outreach' },
                  ].map((ph, i) => (
                    <div key={i} className={`aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br ${ph.c} ring-1 ring-black/5`}>
                      <div className="flex h-full items-end bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.35),transparent_40%)] p-2">
                        <span className="rounded bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-gray-800 shadow">{ph.t}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right rail */}
            <div className="space-y-6">
              {/* About */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 text-lg font-semibold">About this Course</div>
                <div className="text-sm text-gray-700">
                  {summary?.courseName ? (
                    <>
                      <div><span className="font-semibold text-gray-900">{summary.courseName}</span> at {summary.schoolName || 'your school'}</div>
                      <div className="mt-1 text-gray-600">Community hub for all cohorts – share updates, events and achievements.</div>
                    </>
                  ) : (
                    <div>Community hub for your course – share updates, events and achievements.</div>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-gray-50 p-2 ring-1 ring-gray-200">
                    <div className="text-[11px] text-gray-600">Members</div>
                    <div className="text-base font-bold text-gray-900">{summary?.matesCount ?? 0}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 ring-1 ring-gray-200">
                    <div className="text-[11px] text-gray-600">This week XP</div>
                    <div className="text-base font-bold text-gray-900">8.4k</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 ring-1 ring-gray-200">
                    <div className="text-[11px] text-gray-600">Events</div>
                    <div className="text-base font-bold text-gray-900">3</div>
                  </div>
                </div>
              </div>

              {/* Leaderboards (mock) */}
              <div id="leaderboard" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 text-lg font-semibold">Leaderboard</div>
                <div className="text-xs font-semibold text-gray-600">This Week</div>
                <ul className="mt-1 space-y-1">
                  {[1,2,3,4,5].map((n) => (
                    <li key={n} className="flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm">
                      <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">#{n}</span><span className="font-medium text-gray-800">Top Student {n}</span></div>
                      <span className="text-xs text-indigo-700">{1100 - n*41} XP</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 text-xs font-semibold text-gray-600">All Time</div>
                <ul className="mt-1 space-y-1">
                  {[1,2,3,4,5].map((n) => (
                    <li key={n} className="flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm">
                      <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700">#{n}</span><span className="font-medium text-gray-800">Legend {n}</span></div>
                      <span className="text-xs text-amber-700">{5400 - n*123} XP</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Poll (mock) */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 text-lg font-semibold">Poll of the Week</div>
                <div className="text-sm text-gray-800">Which topic should we revise next?</div>
                <div className="mt-2 space-y-2 text-sm">
                  {['Cardio Physiology','Neuroanatomy','Endocrine','Respiratory'].map((o, i) => (
                    <label key={i} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                      <input type="radio" name="poll1" className="text-indigo-600" />
                      <span>{o}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3 text-right">
                  <button className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">Vote</button>
                </div>
              </div>

              {/* Resources (mock) */}
              <div id="resources" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 text-lg font-semibold">Pinned Resources</div>
                <ul className="space-y-2 text-sm">
                  {[{t:'Cardio summary slides', k:'PDF'}, {t:'Neuro MCQ set', k:'QBank'}, {t:'Anatomy lab checklist', k:'DOC'}].map((r, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div className="flex items-center gap-2"><span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">{r.k}</span><span className="font-medium text-gray-800">{r.t}</span></div>
                      <button className="text-xs font-semibold text-indigo-700 hover:underline">Open</button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* People (mock) */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 text-lg font-semibold">New Members</div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {['Ada','Ben','Chika','Diego'].map((n, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl border p-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-700">{initials(n)}</div>
                      <div>
                        <div className="font-medium text-gray-900">{n}</div>
                        <div className="text-xs text-gray-600">Joined this week</div>
                      </div>
                      <button className="ml-auto rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">Say hi</button>
                    </li>
                  ))}
                </ul>
              </div>
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







