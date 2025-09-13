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
    isAdmin?: boolean;
  };
}) {
  const [isAuthed] = useState<boolean | null>(authed);
  const [access] = useState<"verified" | "pending" | "unset" | null>(initial.access || null);
  const [summary] = useState<Summary>(initial.summary || null);
  const [studyVibe, setStudyVibe] = useState<string | null>(initial.studyVibe || null);
  const [isModerator] = useState<boolean>(initial.isModerator || false);
  const [modPending, setModPending] = useState<boolean>(Boolean((initial as any).modRequestPending));
  const [uniModerators] = useState<Mate[]>((initial as any).uniModerators || []);
  const [uniModPending, setUniModPending] = useState<boolean>(Boolean((initial as any).uniModRequestPending));
  const isUniModerator = Boolean((initial as any).isUniModerator);
  const [feed, setFeed] = useState<any[]>(initial.feed || []);
  const [events, setEvents] = useState<any[]>(initial.events || []);
  const [photos, setPhotos] = useState<any[]>(initial.photos || []);
  const [organizations] = useState<Org[]>(initial.organizations || []);
  const [moderators] = useState<Mate[]>(initial.moderators || []);
  const [newPost, setNewPost] = useState("");
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [lb, setLb] = useState<{ weekly: any[]; all: any[] } | null>(null);
  const [isAdmin] = useState<boolean>(Boolean((initial as any).isAdmin));
  const [refreshing, setRefreshing] = useState(false);
  const now = new Date();

  // Load privacy flag on mount if authed
  useEffect(() => {
    if (!authed) return;
    (async () => {
      try { const r = await fetch('/api/course-mates/privacy', { credentials: 'include' }); if (r.ok) { const j = await r.json(); setIsPublic(!!j?.public); } } catch {}
    })();
  }, [authed]);

  useEffect(() => {
    if (!authed) return;
    (async () => { try { const r = await fetch('/api/course-mates/leaderboard', { credentials: 'include' }); if (r.ok) setLb(await r.json()); } catch {} })();
  }, [authed]);

  async function reloadAll() {
    try {
      setRefreshing(true);
      const [f, e, p, l] = await Promise.all([
        fetch('/api/course-mates/feed', { credentials: 'include' }),
        fetch('/api/course-mates/events', { credentials: 'include' }),
        fetch('/api/course-mates/photos', { credentials: 'include' }),
        fetch('/api/course-mates/leaderboard', { credentials: 'include' }),
      ]);
      if (f.ok) { const j = await f.json(); setFeed(j.data || j || []); }
      if (e.ok) { const j = await e.json(); setEvents(j.data || j || []); }
      if (p.ok) { const j = await p.json(); setPhotos(j.data || j || []); }
      if (l.ok) { setLb(await l.json()); }
    } catch {}
    finally { setRefreshing(false); }
  }

  // tiny sparkline helper (placeholder for course XP series)
  const Spark = ({ values, color = '#6366f1' }: { values: number[]; color?: string }) => {
    const W = 140, H = 40, P = 4; const n = Math.max(1, values.length);
    const max = Math.max(1, ...values);
    const x = (i: number) => P + (i * (W - 2 * P)) / Math.max(1, n - 1);
    const y = (v: number) => H - P - (v / max) * (H - 2 * P);
    const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="h-8 w-36">
        <path d={d} fill="none" stroke={color} strokeWidth="2" />
      </svg>
    );
  };

  const feedLimited = (feed || []).slice(0, 5);

  // derive past events for gallery cards
  const pastEvents = useMemo(() => {
    const list = (events || []).filter((e: any) => {
      const t = new Date(e.start_at || e.startAt || e.date || 0).getTime();
      return Number.isFinite(t) && t < Date.now();
    });
    list.sort((a: any, b: any) => new Date(b.start_at || b.startAt || 0).getTime() - new Date(a.start_at || a.startAt || 0).getTime());
    return list.slice(0, 6);
  }, [events]);

  // photo counts keyed by event id if available
  const photoCountByEvent: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of photos || []) {
      const k = String((p as any).event_id || (p as any).eventId || (p as any).event || '');
      if (!k) continue; map[k] = (map[k] || 0) + 1;
    }
    return map;
  }, [photos]);

  // placeholder 7-day course XP sparkline
  const xp7 = useMemo(() => {
    const base = Math.max(3, Number(summary?.matesCount || 5));
    const seed = now.getDate() % 7;
    return new Array(7).fill(0).map((_, i) => Math.round(base * (1 + ((i + seed) % 3) * 0.4)));
  }, [summary?.matesCount]);

  const initials = useMemo(() => (name?: string | null) => {
    const n = (name || "").trim();
    if (!n) return "U";
    return n.split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Mobile placeholder, desktop-only for now */}
      <div className="md:hidden rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-700">
        Course Hub is optimized for desktop. Mobile layout coming soon.
      </div>
      <h1 className="hidden md:block text-2xl font-semibold text-gray-900">Your Course Mates</h1>
      <p className="hidden md:block text-gray-600">Connect with students from your university, school and course. Set your details to see your mates and relevant student organizations.</p>

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
            <div className="grid gap-3 sm:grid-cols-4">
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
              <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Course XP</div>
                  <span className="text-[10px] text-indigo-700/80">Last 7 days</span>
                </div>
                <div className="mt-1 flex items-end justify-between">
                  <div className="text-2xl font-extrabold text-indigo-900">—</div>
                  <Spark values={xp7} />
                </div>
              </div>
            </div>
            {/* Privacy toggle moved to Settings (below) */}
          </div>

          {/* Feed */}
          <div id="feed" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-semibold">Latest Updates</div>
              <div className="flex items-center gap-2">
                <button onClick={reloadAll} disabled={refreshing} title="Refresh"
                  className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-200 disabled:opacity-60">
                  <svg viewBox="0 0 24 24" className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}><path fill="currentColor" d="M12 6V3L8 7l4 4V8a4 4 0 1 1-4 4H6a6 6 0 1 0 6-6z"/></svg>
                  Refresh
                </button>
                {access === 'verified' && (
                  <form className="flex items-center gap-2" onSubmit={async (e)=>{ e.preventDefault(); const t = newPost.trim(); if(!t) return; try { const r = await fetch('/api/course-mates/feed', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content: t }) }); if(r.ok){ const j = await r.json(); setFeed(j.data || []); setNewPost(''); } } catch{} }}>
                    <input value={newPost} onChange={(e)=>setNewPost(e.target.value)} placeholder="Post an update" className="w-64 rounded-lg border px-3 py-1.5 text-sm" />
                    <button className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">Post</button>
                  </form>
                )}
              </div>
            </div>
            <ul className="space-y-3">
              {feedLimited.map((p:any) => (
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
            {feed.length > 5 && (
              <div className="mt-3 text-center text-xs text-gray-600">Showing latest 5 updates.</div>
            )}
          </div>

          {/* Leaderboard */}
          <div id="leaderboard" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-lg font-semibold">Leaderboard</div>
              <div className="text-[11px] text-gray-500">Top performers in your course</div>
            </div>
            <div className="text-xs font-semibold text-gray-600">This Week</div>
            <ul className="mt-1 space-y-1">
              {(lb?.weekly || []).map((r:any, i:number) => {
                const isTop3 = i < 3; const medal = i===0? '🥇' : i===1? '🥈' : i===2? '🥉' : null;
                const xp = Number(r.weekly_xp || 0);
                const bar = Math.min(100, Math.round((xp / Math.max(1, Number((lb?.weekly?.[0]||{}).weekly_xp || xp))) * 100));
                return (
                  <li key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ring-1 ${isTop3 ? 'bg-gradient-to-r from-indigo-50 to-fuchsia-50 ring-indigo-200' : 'bg-white ring-gray-200'}`}>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`grid h-7 w-7 place-items-center rounded-full ${isTop3 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'} text-[11px] font-bold`}>{medal || `#${i+1}`}</span>
                      <span className="truncate font-medium text-gray-800">{r.name || r.username || 'Student'}</span>
                    </div>
                    <div className="ml-3 flex w-40 items-center gap-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-2 rounded-full ${isTop3 ? 'bg-indigo-500' : 'bg-gray-300'}`} style={{ width: `${bar}%` }} />
                      </div>
                      <span className={`shrink-0 text-xs ${isTop3 ? 'text-indigo-700' : 'text-gray-700'}`}>{xp} XP</span>
                    </div>
                  </li>
                );
              })}
              {!lb?.weekly?.length && <li className="rounded-lg border px-3 py-1.5 text-sm text-gray-600">No data yet.</li>}
            </ul>
            <div className="mt-3 text-xs font-semibold text-gray-600">All Time</div>
            <ul className="mt-1 space-y-1">
              {(lb?.all || []).map((r:any, i:number) => {
                const isTop3 = i < 3; const medal = i===0? '🏆' : i===1? '🥈' : i===2? '🥉' : null;
                const xp = Number(r.xp || 0);
                const bar = Math.min(100, Math.round((xp / Math.max(1, Number((lb?.all?.[0]||{}).xp || xp))) * 100));
                return (
                  <li key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ring-1 ${isTop3 ? 'bg-gradient-to-r from-amber-50 to-rose-50 ring-amber-200' : 'bg-white ring-gray-200'}`}>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`grid h-7 w-7 place-items-center rounded-full ${isTop3 ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'} text-[11px] font-bold`}>{medal || `#${i+1}`}</span>
                      <span className="truncate font-medium text-gray-800">{r.name || r.username || 'Student'}</span>
                    </div>
                    <div className="ml-3 flex w-40 items-center gap-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div className={`h-2 rounded-full ${isTop3 ? 'bg-amber-500' : 'bg-gray-300'}`} style={{ width: `${bar}%` }} />
                      </div>
                      <span className={`shrink-0 text-xs ${isTop3 ? 'text-amber-700' : 'text-gray-700'}`}>{xp} XP</span>
                    </div>
                  </li>
                );
              })}
              {!lb?.all?.length && <li className="rounded-lg border px-3 py-1.5 text-sm text-gray-600">No data yet.</li>}
            </ul>
          </div>

          {/* Events + Mini Calendar */}
          <div id="events" className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-lg font-semibold">Upcoming Events</div>
                {isModerator && (
                  <button onClick={async()=>{ const title = window.prompt('Event title'); if(!title) return; const when = window.prompt('Start (YYYY-MM-DD HH:mm)', ''); const startAt = when ? new Date((when as any).replace(' ', 'T')) : new Date(); const location = window.prompt('Location (optional)') || null; const thumbUrl = window.prompt('Thumbnail URL (optional)') || null; try { const r = await fetch('/api/course-mates/events', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, startAt, location, thumbUrl }) }); if(r.ok){ const j = await r.json(); setEvents(j.data || []);} } catch{} }} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">Add event</button>
                )}
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                {events.map((ev:any)=> (
                  <li key={ev.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="flex items-center gap-2">
                    {ev.thumb_url && <img src={ev.thumb_url} alt="thumb" className="h-10 w-10 rounded object-cover" />}
                    <div>
                      <div className="font-semibold">{ev.title}</div>
                      <div className="text-xs text-gray-600">{new Date(ev.start_at || ev.startAt).toLocaleString()} {ev.location ? '· '+ev.location : ''}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">Remind me</span>
                </li>
              ))}
              {!events.length && <li className="rounded-lg border px-3 py-2 text-gray-600">No upcoming events.</li>}
              </ul>
            </div>
            <CuteCalendar events={events} />
          </div>

          {/* Past events gallery */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-semibold">Past Events</div>
              <div className="text-xs text-gray-600">Thumbnails with key details</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {pastEvents.map((ev: any) => {
                const id = (ev as any).id ?? (ev as any).event_id ?? (ev as any).eventId;
                const count = id != null ? (photoCountByEvent[String(id)] || 0) : 0;
                return (
                  <div key={`past-${id}`} className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                      {ev.thumb_url && <img src={ev.thumb_url} alt={ev.title} className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />}
                    </div>
                    <div className="p-3">
                      <div className="truncate font-semibold text-gray-900" title={ev.title}>{ev.title}</div>
                      <div className="mt-0.5 text-[11px] text-gray-600">{new Date(ev.start_at || ev.startAt).toLocaleDateString()} · by {ev.created_by || 'moderator'} · {count} photos</div>
                    </div>
                  </div>
                );
              })}
              {!pastEvents.length && <div className="rounded-xl border p-6 text-center text-sm text-gray-600">No past events yet.</div>}
            </div>
          </div>

          {/* Photos */}
          <div id="photos" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-semibold">Photos from Events</div>
              {isModerator && (
                <button onClick={async()=>{ const url = window.prompt('Link URL (folder or image)'); if(!url) return; const caption = window.prompt('Caption (optional)') || null; const thumbUrl = window.prompt('Thumbnail URL (optional)') || null; try { const r = await fetch('/api/course-mates/photos', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url, caption, thumbUrl }) }); if(r.ok){ const j = await r.json(); setPhotos(j.data || []);} } catch{} }} className="text-xs font-semibold text-indigo-700 hover:underline">Add link</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((p:any)=> (
                <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="group block aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-black/5">
                  <img src={p.thumb_url || p.url} alt={p.caption || 'Event photo'} className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
                </a>
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
                  {isAdmin && (
                    <button
                      onClick={async()=>{ try { await fetch('/api/admin/course-mates/moderators', { method:'DELETE', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ courseId: (initial as any).me?.medicalCourseId, userId: m.id }) }); location.reload(); } catch {} }}
                      className="ml-auto rounded bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200"
                    >Remove</button>
                  )}
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

            {/* University reps subsection */}
            <div className="mt-5 border-t pt-3">
              <div className="mb-2 text-sm font-semibold">University Representatives</div>
              <ul className="space-y-2">
                {((uniModerators as any) || []).map((m: any) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-700">{initials(m.name || m.username)}</div>
                    <div className="text-sm text-gray-900">{m.name || m.username}</div>
                    {isAdmin && (
                      <button onClick={async()=>{ try { await fetch('/api/admin/universities/moderators', { method:'DELETE', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ universityId: (initial as any).me?.universityId, userId: m.id }) }); location.reload(); } catch {} }} className="ml-auto rounded bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200">Remove</button>
                    )}
                  </li>
                ))}
                {(!uniModerators || (uniModerators as any).length===0) && <li className="text-sm text-gray-600">No university reps yet.</li>}
              </ul>
              {!isUniModerator && access==='verified' && (
                <div className="mt-3">
                  <button disabled={uniModPending} onClick={async()=>{ try { const r = await fetch('/api/universities/moderators/apply', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({}) }); if (r.ok) setUniModPending(true); } catch {} }} className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{uniModPending ? 'Application sent' : 'Apply as a university representative'}</button>
                </div>
              )}
            </div>
          </div>
          
          {/* Settings */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Settings</div>
            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Make my profile public</div>
                  <div className="text-[11px] text-gray-600">Public profiles appear across the website (e.g., university counts and Course Mates). Includes your name, username and profile picture.</div>
                </div>
                <button
                  type="button"
                  onClick={async()=>{
                    const next = !isPublic;
                    if (next) { const ok = window.confirm('Are you sure you want to make your profile public?\n\nYour name, username and profile picture will be visible across EnterMedSchool (e.g., Course Mates and university pages). You can switch this off anytime.'); if (!ok) return; }
                    setIsPublic(next);
                    try { await fetch('/api/course-mates/privacy', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ public: next }) }); } catch {}
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${isPublic ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  aria-pressed={isPublic}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
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

function CuteCalendar({ events }: { events: any[] }) {
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [selected, setSelected] = useState<number | null>(null);

  const marks = useMemo(() => {
    const m = new Map<number, number>();
    for (const e of events || []) {
      const d = new Date((e as any).start_at || (e as any).startAt || (e as any).date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate(); m.set(day, (m.get(day) || 0) + 1);
      }
    }
    return m;
  }, [events, month, year]);

  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | '')[] = [];
  for (let i = 0; i < startDay; i++) cells.push('' as any);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push('' as any);

  const wk = ['S','M','T','W','T','F','S'];

  function prevMonth() {
    const d = new Date(year, month, 1); d.setMonth(d.getMonth() - 1); setMonth(d.getMonth()); setYear(d.getFullYear()); setSelected(null);
  }
  function nextMonth() {
    const d = new Date(year, month, 1); d.setMonth(d.getMonth() + 1); setMonth(d.getMonth()); setYear(d.getFullYear()); setSelected(null);
  }

  const selectedEvents = useMemo(() => {
    if (!selected) return [] as any[];
    return (events || []).filter((e: any) => {
      const d = new Date(e.start_at || e.startAt || e.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selected;
    });
  }, [selected, events, month, year]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-semibold">Calendar</div>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={prevMonth} className="grid h-7 w-7 place-items-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200" aria-label="Previous month">
            <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>
          <div className="min-w-[8rem] text-center font-semibold text-gray-800">{new Date(year, month).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
          <button onClick={nextMonth} className="grid h-7 w-7 place-items-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200" aria-label="Next month">
            <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {wk.map((d) => <div key={d} className="py-1 font-semibold text-gray-600">{d}</div>)}
        {cells.map((n, i) => (
          <button
            key={i}
            className={`grid h-9 place-items-center rounded transition ${n ? 'bg-gray-50 text-gray-700 ring-1 ring-gray-200 hover:bg-indigo-50 hover:ring-indigo-200' : ''} ${selected===n ? 'bg-indigo-100 ring-indigo-300' : ''}`}
            onClick={() => typeof n === 'number' ? setSelected(n) : undefined}
          >
            <div className="relative">
              <span className="text-[11px]">{(n as any) || ''}</span>
              {typeof n === 'number' && marks.get(n) && <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-600">{selected ? `Events on ${new Date(year, month, selected).toLocaleDateString()}` : 'Click a date to view events'}</div>
      {!!selected && (
        <ul className="mt-2 space-y-2 text-sm">
          {selectedEvents.map((ev: any) => (
            <li key={ev.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div className="flex items-center gap-2">
                {ev.thumb_url && <img src={ev.thumb_url} alt="thumb" className="h-8 w-8 rounded object-cover" />}
                <div>
                  <div className="font-semibold">{ev.title}</div>
                  <div className="text-xs text-gray-600">{new Date(ev.start_at || ev.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {ev.location ? '· '+ev.location : ''}</div>
                </div>
              </div>
              <a href="#" className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">Details</a>
            </li>
          ))}
          {!selectedEvents.length && <li className="rounded-lg border px-3 py-2 text-gray-600">No events on this date.</li>}
        </ul>
      )}
    </div>
  );
}
