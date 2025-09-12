"use client";

import { useMemo, useState, useEffect } from "react";

type Option = { id: number; name: string; slug?: string };
type Org = { id: number; name: string; slug: string; website?: string | null; description?: string | null };
type Mate = { id: number; name?: string | null; username?: string | null; image?: string | null };

type Summary = { matesCount: number; courseName?: string | null; schoolName?: string | null; studyYear?: number | null; activeNow?: number | null } | null;

export default function CourseMatesClient({ authed, initial }: {
  authed: boolean;
  initial: {
    universities: Option[];
    schools: Option[];
    courses: Option[];
    organizations: Org[];
    mates: Mate[];
    me: any;
    access: "verified" | "pending" | "unset" | null;
    summary: Summary;
    studyVibe: string | null;
    isModerator: boolean;
    feed: any[];
    events: any[];
    photos: any[];
    moderators: Mate[];
    modRequestPending?: boolean;
  };
}) {
  const [isAuthed] = useState<boolean | null>(authed);
  const [access] = useState<"verified" | "pending" | "unset" | null>(initial.access || null);
  const [summary] = useState<Summary>(initial.summary || null);
  const [studyVibe, setStudyVibe] = useState<string | null>(initial.studyVibe || null);
  const [isModerator] = useState<boolean>(initial.isModerator || false);
  const [modPending, setModPending] = useState<boolean>(Boolean((initial as any).modRequestPending));
  const [feed, setFeed] = useState<any[]>(initial.feed || []);
  const [events, setEvents] = useState<any[]>(initial.events || []);
  const [photos, setPhotos] = useState<any[]>(initial.photos || []);
  const [organizations] = useState<Org[]>(initial.organizations || []);
  const [moderators] = useState<Mate[]>(initial.moderators || []);
  const [newPost, setNewPost] = useState("");
  const [isPublic, setIsPublic] = useState<boolean>(false);

  // Load privacy flag on mount if authed
  useEffect(() => {
    if (!authed) return;
    (async () => {
      try { const r = await fetch('/api/course-mates/privacy', { credentials: 'include' }); if (r.ok) { const j = await r.json(); setIsPublic(!!j?.public); } } catch {}
    })();
  }, [authed]);

  const initials = useMemo(() => (name?: string | null) => {
    const n = (name || "").trim();
    if (!n) return "U";
    return n.split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Your Course Mates</h1>
      <p className="text-gray-600">Connect with students from your university, school and course. Set your details to see your mates and relevant student organizations.</p>

      {(access === "verified" || access === "pending") && (
        <div className="mt-6 space-y-6">
          <div className="overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow-md">
            <div className="relative px-6 py-8 sm:px-8">
              <div className="absolute inset-0 opacity-20 [background:radial-gradient(ellipse_at_top_left,white_0%,transparent_60%),radial-gradient(ellipse_at_bottom_right,white_0%,transparent_60%)]" />
              <div className="relative">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/80">Course Hub</div>
                    <h2 className="mt-1 text-2xl font-extrabold leading-tight text-white sm:text-3xl">{summary?.courseName || 'Your Course'}</h2>
                    <div className="mt-1 text-sm text-indigo-100">Year {summary?.studyYear ?? '—'}</div>
                  </div>
                  <div className="hidden sm:flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <a href="#feed" className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/30">Post update</a>
                    {isModerator && <a href="#events" className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/30">Create event</a>}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-indigo-100/90">
                  {['Overview','Feed','Leaderboard','Photos','Events','Orgs'].map((t, i) => (
                    <a key={i} href={`#${t.toLowerCase()}`} className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/15">{t}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm" id="overview">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-semibold">Highlights</div>
              <a href="#feed" className="text-xs font-semibold text-indigo-700 hover:underline">See feed</a>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Active now</div>
                <div className="mt-1 text-2xl font-extrabold text-indigo-900">{summary?.activeNow ?? 0}</div>
                <div className="text-xs text-indigo-800/80">classmates online</div>
              </div>
              <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Study vibe</div>
                <div className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-emerald-900">
                  <span>{studyVibe || '—'}</span>
                  {isModerator && (
                    <button title="Edit" onClick={async()=>{ const v = window.prompt('Set study vibe', studyVibe || '') || ''; try { const r = await fetch('/api/course-mates/settings', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ studyVibe: v }) }); if (r.ok) { const j = await r.json(); setStudyVibe(j?.settings?.studyVibe ?? v); } } catch {} }} className="ml-1 rounded-md border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700">Edit</button>
                  )}
                </div>
                <div className="text-xs text-emerald-800/80">set by course moderators</div>
              </div>
              <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Members</div>
                <div className="mt-1 text-2xl font-extrabold text-amber-900">{summary?.matesCount ?? 0}</div>
                <div className="text-xs text-amber-800/80">verified classmates</div>
              </div>
            </div>
            {/* Privacy toggle */}
            <div className="mt-3 rounded-xl border bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Make my profile public</div>
                  <div className="text-[11px] text-gray-600">Public profiles appear in university counts and Course Mates. You can change this anytime.</div>
                </div>
                <button
                  type="button"
                  onClick={async()=>{ const next = !isPublic; setIsPublic(next); try { await fetch('/api/course-mates/privacy', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ public: next }) }); } catch {} }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${isPublic ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  aria-pressed={isPublic}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Feed */}
          <div id="feed" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-semibold">Course Feed</div>
              {access === 'verified' && (
                <form className="flex items-center gap-2" onSubmit={async (e)=>{ e.preventDefault(); const t = newPost.trim(); if(!t) return; try { const r = await fetch('/api/course-mates/feed', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content: t }) }); if(r.ok){ const j = await r.json(); setFeed(j.data || []); setNewPost(''); } } catch{} }}>
                  <input value={newPost} onChange={(e)=>setNewPost(e.target.value)} placeholder="Post an update" className="w-64 rounded-lg border px-3 py-1.5 text-sm" />
                  <button className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">Post</button>
                </form>
              )}
            </div>
            <ul className="space-y-3">
              {feed.map((p:any) => (
                <li key={p.id} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials(p.name || p.username)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">{p.name || p.username || 'Student'}</div>
                        <div className="text-xs text-gray-500">{new Date(p.created_at || Date.now()).toLocaleString()}</div>
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{p.content}</div>
                    </div>
                  </div>
                </li>
              ))}
              {!feed.length && <li className="rounded-xl border border-gray-200 p-3 text-sm text-gray-600">No posts yet.</li>}
            </ul>
          </div>

          {/* Events */}
          <div id="events" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-semibold">Upcoming Events</div>
              {isModerator && (
                <button onClick={async()=>{ const title = window.prompt('Event title'); if(!title) return; const when = window.prompt('Start (YYYY-MM-DD HH:mm)', ''); const startAt = when ? new Date((when as any).replace(' ', 'T')) : new Date(); const location = window.prompt('Location (optional)') || null; try { const r = await fetch('/api/course-mates/events', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, startAt, location }) }); if(r.ok){ const j = await r.json(); setEvents(j.data || []);} } catch{} }} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">Add event</button>
              )}
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              {events.map((ev:any)=> (
                <li key={ev.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div>
                    <div className="font-semibold">{ev.title}</div>
                    <div className="text-xs text-gray-600">{new Date(ev.start_at || ev.startAt).toLocaleString()} {ev.location ? '· '+ev.location : ''}</div>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">Remind me</span>
                </li>
              ))}
              {!events.length && <li className="rounded-lg border px-3 py-2 text-gray-600">No upcoming events.</li>}
            </ul>
          </div>

          {/* Photos */}
          <div id="photos" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-semibold">Photos from Events</div>
              {isModerator && (
                <button onClick={async()=>{ const url = window.prompt('Image URL'); if(!url) return; const caption = window.prompt('Caption (optional)') || null; try { const r = await fetch('/api/course-mates/photos', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url, caption }) }); if(r.ok){ const j = await r.json(); setPhotos(j.data || []);} } catch{} }} className="text-xs font-semibold text-indigo-700 hover:underline">Add link</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((p:any)=> (
                <div key={p.id} className="aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-black/5">
                  <img src={p.url} alt={p.caption || 'Event photo'} className="h-full w-full object-cover" />
                </div>
              ))}
              {!photos.length && <div className="rounded-xl border p-6 text-center text-sm text-gray-600">No photos yet.</div>}
            </div>
          </div>

          {/* Organizations */}
          <div id="orgs" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-lg font-semibold">Student Organizations</div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {organizations.map((o)=> (
                <li key={o.id} className="rounded-xl border p-3">
                  <div className="font-semibold text-gray-900">{o.name}</div>
                  {o.website && <a href={o.website} target="_blank" rel="noreferrer" className="text-xs text-indigo-700 hover:underline">Website</a>}
                  {o.description && <div className="mt-1 text-xs text-gray-600 line-clamp-2">{o.description}</div>}
                </li>
              ))}
              {!organizations.length && <li className="rounded-xl border p-3 text-sm text-gray-600">No organizations yet.</li>}
            </ul>
          </div>

          {/* Representatives */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Representatives</div>
            <ul className="space-y-2">
              {moderators.map((m)=> (
                <li key={m.id} className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-700">{initials(m.name || m.username)}</div>
                  <div className="text-sm text-gray-900">{m.name || m.username}</div>
                </li>
              ))}
              {!moderators.length && <li className="text-sm text-gray-600">No representatives assigned yet.</li>}
            </ul>
            <div className="mt-2 text-[11px] text-gray-500">Your EnterMedSchool representatives, who have edit access to this private student hub.</div>
            {!isModerator && access==='verified' && (
              <div className="mt-3">
                <button disabled={modPending} onClick={async()=>{ try { const r = await fetch('/api/course-mates/moderators/apply', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({}) }); if (r.ok) setModPending(true); } catch {} }} className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{modPending ? 'Application sent' : 'Apply as a representative'}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Signed-in but no access */}
      {isAuthed && access === "unset" && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
          Set your university, school, course and study year in <a href="/me/profile" className="font-semibold underline">Edit profile</a> to unlock your Course Hub.
        </div>
      )}

      {/* Signed-out minimal message */}
      {!isAuthed && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-700">Sign in to view your course hub.</div>
      )}
    </div>
  );
}

