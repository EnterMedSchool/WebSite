"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";

type Option = { id: number; name: string; slug?: string };
type Org = { id: number; name: string; slug?: string; website?: string | null; description?: string | null };
type Mate = { id: number; name?: string | null; username?: string | null; image?: string | null };

type Summary = { matesCount: number; courseName?: string | null; schoolName?: string | null; studyYear?: number | null; activeNow?: number | null } | null;

export default function CourseMatesClient({ authed, initial }: {
  authed: boolean;
  initial: {
    universities?: Option[];
    schools?: Option[];
    courses?: Option[];
    organizations?: Org[];
    mates?: Mate[];
    me?: any;
    access: "verified" | "pending" | "unset" | null;
    summary: Summary;
    studyVibe: string | null;
    isModerator: boolean;
    feed: any[];
    events: any[];
    photos: any[];
    moderators: Mate[];
    uniModerators?: Mate[];
    isAdmin?: boolean;
    coverUrl?: string | null;
    sidePhotos?: string[] | null;
  };
}) {
  const [isAuthed] = useState<boolean>(authed);
  const [access] = useState<"verified" | "pending" | "unset" | null>(initial.access || null);
  const [summary, setSummary] = useState<Summary>(initial.summary || null);
  const [studyVibe, setStudyVibe] = useState<string | null>(initial.studyVibe || null);
  const [isModerator] = useState<boolean>(Boolean(initial.isModerator));
  const [feed, setFeed] = useState<any[]>(initial.feed || []);
  const [events, setEvents] = useState<any[]>(initial.events || []);
  const [photos, setPhotos] = useState<any[]>(initial.photos || []);
  const [organizations] = useState<Org[]>(initial.organizations || []);
  const [moderators] = useState<Mate[]>(initial.moderators || []);
  const [uniModerators] = useState<Mate[]>((initial as any).uniModerators || []);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [lb, setLb] = useState<{ weekly: any[]; all: any[] } | null>(null);
  const [newPost, setNewPost] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showHomepage, setShowHomepage] = useState(false);
  const [ankiTab, setAnkiTab] = useState<'overview'|'leaderboard'>('overview');

  // cover + side images (UI only)
  const coverUrl = (initial as any).coverUrl || 'https://lh3.googleusercontent.com/pw/AP1GczMr5O1wlREX3ue3C4Nn85hh1IIT_-u24Y0xgkrxV_dgAIeYOHzu247rXjfLO7M_p4g0DMEW_ZYun6OvL7xscLqCN2FYTMYxhv32_raakzhjKpkWNEFArYKgTAbDT6046w5Jj3Tdhk_Rcl97t7gjdTbf=w1273-h848-s-no-gm?authuser=0';
  const sidePhotos: string[] = (initial as any).sidePhotos && (initial as any).sidePhotos.length ? (initial as any).sidePhotos : [
    'https://lh3.googleusercontent.com/pw/AP1GczNII8GvBGeyCkBjHhiA_w4fP8UtC3hTSWtrct2CcFqIOfgDaEpWCBFIVgo6G49M2O6FFJEIUQ5tYXgoLVcbs2TnHnMwJMeGx6y-sCilOHyAxZ70sNlYa8WND6wYlc4lsn_qiiTkVg_fjdeBxUexKdgZ=w1273-h848-s-no-gm?authuser=0',
    'https://lh3.googleusercontent.com/pw/AP1GczNM1VEY1T21xH-NYcSbvz0JBn4E5Iafb6v3qoS6hqlUsHK7apCX-BJC2cN4BoZdBzQZFKWLTOH5vwLXQJCSPw7D5A7JZo1xNuCFLpy-l7kj8hUyWTl83bPVXNH--nrSFbVD3t29AP5zrHiDKP8EoX-J=w1273-h848-s-no-gm?authuser=0',
  ];

  // Parallax hero
  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacityBg = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  // Page progress bar
  const { scrollYProgress: pageProgress } = useScroll();

  // Scroll spy
  const sectionIds = [
    'overview','announcements','invite',
    'goals','exams','syllabus','tutors','buddies',
    'feed','leaderboard','anki','events','photos',
    'rotations','reviews','help','polls','resources',
    'market','opportunities','scholarships','wiki','essentials',
    'contributors','shoutouts','digest','decks','practice','trending',
    'improvements','orgs','reps','kudos','settings'
  ] as const;
  const [activeId, setActiveId] = useState<string>('overview');
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) {
        setActiveId(visible[0].target.id);
      }
    }, { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] });
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [sectionIds]);

  // Load privacy + leaderboard on mount
  useEffect(() => {
    if (!isAuthed || access !== 'verified') return;
    (async () => { try { const r = await fetch('/api/course-mates/privacy', { credentials: 'include' }); if (r.ok) { const j = await r.json(); setIsPublic(Boolean(j?.public)); } } catch {} })();
  }, [isAuthed, access]);

  useEffect(() => {
    if (!isAuthed || access !== 'verified') return;
    (async () => { try { const r = await fetch('/api/course-mates/leaderboard', { credentials: 'include' }); if (r.ok) setLb(await r.json()); } catch {} })();
  }, [isAuthed, access]);

  async function reloadAll() {
    if (!isAuthed || access !== 'verified') return;
    setRefreshing(true);
    try {
      const [f, e, p, s] = await Promise.all([
        fetch('/api/course-mates/feed', { credentials: 'include' }),
        fetch('/api/course-mates/events', { credentials: 'include' }),
        fetch('/api/course-mates/photos', { credentials: 'include' }),
        fetch('/api/course-mates/summary', { credentials: 'include' }),
      ]);
      if (f.ok) { const j = await f.json(); setFeed(j.data || j || []); }
      if (e.ok) { const j = await e.json(); setEvents(j.data || j || []); }
      if (p.ok) { const j = await p.json(); setPhotos(j.data || j || []); }
      if (s.ok) { const j = await s.json(); setSummary(j || null); }
    } catch {}
    setRefreshing(false);
  }

  // tiny sparkline helper
  const Spark = ({ values, color = '#6366f1' }: { values: number[]; color?: string }) => {
    const W = 140, H = 40, P = 4; const n = Math.max(1, values.length);
    const max = Math.max(1, ...values);
    const x = (i: number) => P + (i * (W - 2 * P)) / Math.max(1, n - 1);
    const y = (v: number) => H - P - (v / max) * (H - 2 * P);
    const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
    return <svg viewBox={`0 0 ${W} ${H}`} className="h-8 w-36"><path d={d} fill="none" stroke={color} strokeWidth="2" /></svg>;
  };

  const initials = useMemo(() => (name?: string | null) => {
    const n = (name || "").trim(); if (!n) return "U";
    return n.split(/\s+/).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  }, []);

  const xp7 = useMemo(() => [4, 6, 5, 8, 7, 9, 10], []);
  const feedLimited = useMemo(() => (feed || []).slice(0, 6), [feed]);

  if (!isAuthed) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-700">Sign in to view your course hub.</div>
      </div>
    );
  }
  if (isAuthed && access === "unset") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 text-sm text-indigo-900">
          Set your university, school, course and study year in <a href="/me/profile" className="font-semibold underline">Edit profile</a> to unlock your Course Hub.
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      {/* Top page progress */}
      <motion.div style={{ scaleX: pageProgress }} className="fixed left-0 top-0 z-50 h-1 w-full origin-left bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500" />
      {/* Hero */}
      <div ref={heroRef} className="relative overflow-hidden rounded-3xl border border-indigo-200/60 shadow-md">
        <motion.div style={{ y: yBg, opacity: opacityBg }} className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700 opacity-80" />
          <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/30" />
        </motion.div>
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          <img src={sidePhotos[0]} alt="left" className="absolute left-0 top-0 h-full w-64 object-cover opacity-80" style={{ filter: 'blur(1.5px)', WebkitMaskImage: 'linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0.1))', maskImage: 'linear-gradient(to right, rgba(255,255,255,1), rgba(255,255,255,0.1))' }} />
          <img src={sidePhotos[1]} alt="right" className="absolute right-0 top-0 h-full w-64 object-cover opacity-80" style={{ filter: 'blur(1.5px)', WebkitMaskImage: 'linear-gradient(to left, rgba(255,255,255,1), rgba(255,255,255,0.1))', maskImage: 'linear-gradient(to left, rgba(255,255,255,1), rgba(255,255,255,0.1))' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/20 to-white/60 mix-blend-screen" />
        </div>
        <div className="relative px-6 py-8 sm:px-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/80">Course Hub</div>
              <h1 className="mt-1 text-2xl font-extrabold leading-tight text-white md:text-3xl">{summary?.courseName || 'Your Course'}</h1>
              <div className="mt-1 text-sm text-indigo-100">Year {summary?.studyYear ?? '-'}</div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
              <a href="#feed" className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/30 transition">Post update</a>
              {isModerator && <a href="#events" className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/30 transition">Create event</a>}
              <button onClick={()=>setShowHomepage(true)} className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/30 transition">Set as homepage</button>
            </div>
          </div>
        </div>
      </div>

      {/* 3-column layout shell */}
      <div className="mt-6 grid grid-cols-12 gap-6">
        {/* Left sticky nav */}
        <aside className="col-span-12 md:col-span-3">
          <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">Sections</div>
            <nav className="grid gap-1 text-sm">
              {sectionIds.map((id) => {
                const label = id[0].toUpperCase()+id.slice(1);
                const active = activeId === id;
                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    onClick={(e)=>{ e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                    className={`rounded-lg px-2 py-1.5 transition ${active ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    {label}
                  </a>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content scaffold */}
        <main className="col-span-12 md:col-span-6 space-y-6">
          {/* Highlights */}
          <section id="overview" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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
                </div>
                <div className="text-xs text-emerald-800/80">set by course moderators</div>
              </div>
              <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Members</div>
                <div className="mt-1 text-2xl font-extrabold text-amber-900">{summary?.matesCount ?? 0}</div>
                <div className="text-xs text-amber-800/80">verified classmates</div>
              </div>
              <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/60 p-4">
                <div className="flex items-center justify-between"><div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Course XP</div><span className="text-[10px] text-indigo-700/80">Last 7 days</span></div>
                <div className="mt-1 flex items-end justify-between"><div className="text-2xl font-extrabold text-indigo-900">—</div><Spark values={[4,6,5,8,7,9,10]} /></div>
              </div>
            </div>
          </section>

          {/* Feed & Leaderboard */}
          <section id="feed" className="grid gap-6 md:grid-cols-2">
            {/* Feed */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-lg font-semibold">Latest Updates</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={reloadAll}
                    disabled={refreshing}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ring-1 transition ${refreshing ? 'bg-gray-100 text-gray-500 ring-gray-200' : 'bg-indigo-50 text-indigo-700 ring-indigo-200 hover:bg-indigo-100'}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M12 6V3L8 7l4 4V8a4 4 0 1 1-4 4H6a6 6 0 1 0 6-6z"/></svg>
                    {refreshing ? 'Refreshing' : 'Refresh'}
                  </button>
                </div>
              </div>
              {(!feed || feed.length === 0) ? (
                <div className="rounded-xl border border-dashed p-4 text-sm text-gray-700">No updates yet. Be the first to share something with your course.</div>
              ) : (
                <ul className="space-y-3">
                  {feedLimited.map((it: any) => (
                    <li key={it.id} className="rounded-xl border border-gray-200 p-3">
                      <div className="flex items-start gap-3">
                        {it.image ? (
                          <img src={it.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-700">{initials(it.name)}</div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="min-w-0 truncate font-semibold text-gray-900">{it.name || it.username || 'Student'}</div>
                            <div className="text-xs text-gray-500">{new Date(it.created_at).toLocaleString()}</div>
                          </div>
                          <div className="mt-1 whitespace-pre-wrap text-[15px] leading-6 text-gray-800">{it.content}</div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Leaderboard */}
            <div id="leaderboard" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between"><div className="text-lg font-semibold">Leaderboard</div><div className="text-[11px] text-gray-500">Top performers</div></div>
              {!lb ? (
                <div className="text-sm text-gray-600">Leaderboard coming soon.</div>
              ) : (
                <>
                  <div className="text-xs font-semibold text-gray-600">This Week</div>
                  <ul className="mt-1 space-y-1">
                    {(lb.weekly || []).map((row: any, i: number) => (
                      <li key={`lbw-${i}`} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-gray-200">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="grid h-7 w-7 place-items-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-700">#{i+1}</div>
                          <div className="truncate">{row.name || row.username || 'Student'}</div>
                        </div>
                        <div className="ml-3 flex items-center gap-2 text-xs text-gray-600"><span className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700 ring-1 ring-indigo-200">{row.points} XP</span></div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 text-xs font-semibold text-gray-600">All Time</div>
                  <ul className="mt-1 space-y-1">
                    {(lb.all || []).map((row: any, i: number) => (
                      <li key={`lba-${i}`} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-gray-200">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="grid h-7 w-7 place-items-center rounded-full bg-amber-50 text-[11px] font-bold text-amber-700">#{i+1}</div>
                          <div className="truncate">{row.name || row.username || 'Student'}</div>
                        </div>
                        <div className="ml-3 flex items-center gap-2 text-xs text-gray-600"><span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 ring-1 ring-amber-200">{row.points} XP</span></div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </section>

          {/* Announcements banner (UI-only) */}
          <section id="announcements" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between"><div className="text-lg font-semibold text-amber-900">Announcements</div><span className="text-[11px] font-semibold text-amber-700">UI only</span></div>
            <ul className="space-y-2 text-sm text-amber-900/90">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-amber-500" /><span>Important update placeholder #{i+1} — short informative text so students quickly understand what’s new.</span></li>
              ))}
            </ul>
          </section>

          {/* Invite block */}
          <section id="invite" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between"><div className="text-lg font-semibold">Invite Your Classmates</div><div className="text-[11px] text-gray-600">Private hub — verified students only</div></div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="text-sm text-gray-700">Share this link in your class chat to grow your hub.</div>
                <div className="mt-1 flex items-center gap-2">
                  <input readOnly value={typeof window !== 'undefined' ? (window.location.origin + '/course-mates') : '/course-mates'} className="w-full rounded-lg border px-3 py-1.5 text-sm" />
                  <button onClick={()=>{ const v = typeof window !== 'undefined' ? (window.location.origin + '/course-mates') : '/course-mates'; try { (navigator as any)?.clipboard?.writeText?.(v); } catch {} }} className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">Copy</button>
                </div>
              </div>
              <div className="grid h-16 w-full max-w-[12rem] place-items-center rounded-xl bg-gradient-to-r from-indigo-50 to-fuchsia-50 text-indigo-800 ring-1 ring-indigo-200"><div className="text-center text-sm font-semibold">+ Invite classmates</div></div>
            </div>
          </section>

          {/* Cohort Goals (UI-only) */}
          <section id="goals" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between"><div className="text-lg font-semibold">Cohort Goals</div><div className="text-[11px] text-gray-600">Shared milestones</div></div>
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between"><div className="h-3 w-40 rounded bg-gray-100" /><span className="h-5 w-10 rounded bg-gray-100" /></div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-2 w-1/2 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-600"><span>Owner —</span><span>Due —</span></div>
                </div>
              ))}
            </div>
          </section>

          {/* Exam Timeline (UI-only) */}
          <section id="exams" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between"><div className="text-lg font-semibold">Exam Timeline</div><div className="text-[11px] text-gray-600">Key dates & prep focus</div></div>
            <ul className="space-y-3">
              {['Midterm','OSCE','Final'].map((t, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">{new Date(Date.now()+i*21*86400000).toLocaleDateString()}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{t}</div>
                    <div className="mt-1 h-3 w-3/4 rounded bg-gray-100" />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Syllabus Map (UI-only) */}
          <section id="syllabus" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between"><div className="text-lg font-semibold">Syllabus Map</div><div className="text-[11px] text-gray-600">You are here</div></div>
            <div className="grid gap-2 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between"><div className="h-3 w-40 rounded bg-gray-100" />{i===1 && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-200">Now</span>}</div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100"><div className="h-2 w-1/3 rounded-full bg-indigo-400" /></div>
                </div>
              ))}
            </div>
          </section>

          {/* Tutor Hours (UI-only) */}
          <section id="tutors" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between"><div className="text-lg font-semibold">Tutor Hours</div><div className="text-[11px] text-gray-600">Peer support times</div></div>
            <ul className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border px-3 py-2">
                  <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-gray-100" /><div><div className="h-3 w-40 rounded bg-gray-100" /><div className="mt-1 h-3 w-24 rounded bg-gray-100" /></div></div>
                  <div className="h-7 w-24 rounded-full bg-indigo-50 ring-1 ring-indigo-200" />
                </li>
              ))}
            </ul>
          </section>

          {/* Buddy Matching (UI-only) */}
          <section id="buddies" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between"><div className="text-lg font-semibold">Find a Buddy</div><div className="text-[11px] text-gray-600">Interests & availability</div></div>
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-gray-100" /><div className="h-3 w-32 rounded bg-gray-100" /></div>
                  <div className="mt-2 flex flex-wrap gap-1 text-[11px]"><span className="rounded-full bg-gray-100 px-2 py-0.5">Evenings</span><span className="rounded-full bg-gray-100 px-2 py-0.5">Neuro</span><span className="rounded-full bg-gray-100 px-2 py-0.5">Pomodoro</span></div>
                  <div className="mt-2 h-7 w-full rounded-full bg-indigo-50 ring-1 ring-indigo-200" />
                </div>
              ))}
            </div>
          </section>

          {/* Anki (UI-only skeleton) */}
          <section id="anki" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between"><div className="text-lg font-semibold">Anki — Course Insights</div><div className="flex gap-1 rounded-full bg-gray-100 p-1 text-xs"><button className="rounded-full bg-white px-2 py-1 font-semibold shadow-sm">Overview</button><button className="rounded-full px-2 py-1 font-semibold">Leaderboard</button></div></div>
            <div className="grid gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-4">
                  <div className="h-3 w-28 rounded bg-gray-100" />
                  <div className="mt-2 flex items-end justify-between"><div className="h-6 w-14 rounded bg-gray-100" /><Skeleton className="h-8 w-36 rounded" /></div>
                </div>
              ))}
            </div>
          </section>

          {/* Events */}
          <section id="events" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-lg font-semibold">Upcoming Events</div>
              {isModerator && <button onClick={()=>document.getElementById('feed')?.scrollIntoView({ behavior:'smooth' })} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">Create</button>}
            </div>
            {(!events || events.length === 0) ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-gray-700">No upcoming events.</div>
            ) : (
              <ul className="space-y-2 text-sm text-gray-700">
                {events.map((ev: any) => {
                  const at = ev.start_at ? new Date(ev.start_at) : null;
                  return (
                    <li key={ev.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-200">{at ? at.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Soon'}</span>
                        <div>
                          <div className="font-medium text-gray-900">{ev.title}</div>
                          <div className="text-[11px] text-gray-600">{at ? at.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''} {ev.location ? `· ${ev.location}` : ''}</div>
                        </div>
                      </div>
                      <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">Remind me</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Photos */}
          <section id="photos" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Photos from Events</div>
            {(!photos || photos.length === 0) ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-gray-700">No photos yet.</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.slice(0, 9).map((ph: any) => (
                  <img key={ph.id} src={ph.thumb_url || ph.url} alt={ph.caption || ''} className="aspect-[4/3] w-full rounded-xl object-cover" />
                ))}
              </div>
            )}
          </section>

          {/* Resources exchange (skeleton) */}
          <section id="resources" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Resources Exchange</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-3"><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><div className="space-y-2"><Skeleton className="h-3 w-40 rounded" /><Skeleton className="h-3 w-28 rounded" /></div></div><div className="mt-2 flex flex-wrap gap-1"><Skeleton className="h-5 w-24 rounded-full" /><Skeleton className="h-5 w-28 rounded-full" /></div><div className="mt-2 flex items-center gap-2"><Skeleton className="h-7 w-16 rounded-full" /><Skeleton className="h-7 w-16 rounded-full" /></div></div>
              ))}
            </div>
          </section>

          {/* Marketplace (UI-only) */}
          <section id="market" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between"><div className="text-lg font-semibold">Marketplace</div><div className="text-[11px] text-gray-600">Sell / swap</div></div>
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border">
                  <div className="aspect-[4/3] w-full bg-gray-100" />
                  <div className="p-3"><div className="h-3 w-40 rounded bg-gray-100" /><div className="mt-1 h-3 w-24 rounded bg-gray-100" /></div>
                </div>
              ))}
            </div>
          </section>

          {/* Opportunities (UI-only) */}
          <section id="opportunities" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between"><div className="text-lg font-semibold">Opportunities</div><div className="text-[11px] text-gray-600">Research • Volunteering • Internships</div></div>
            <ul className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="rounded-xl border p-3"><div className="h-3 w-60 rounded bg-gray-100" /><div className="mt-1 flex items-center gap-2"><div className="h-5 w-16 rounded-full bg-gray-100" /><div className="h-5 w-20 rounded-full bg-gray-100" /></div></li>
              ))}
            </ul>
          </section>

          {/* Scholarships (UI-only) */}
          <section id="scholarships" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Scholarships</div>
            <ul className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border px-3 py-2"><div className="space-y-1"><div className="h-3 w-60 rounded bg-gray-100" /><div className="h-3 w-32 rounded bg-gray-100" /></div><div className="h-7 w-20 rounded-full bg-emerald-50 ring-1 ring-emerald-200" /></li>
              ))}
            </ul>
          </section>

          {/* Course Wiki / FAQ (UI-only) */}
          <section id="wiki" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Course Wiki / FAQ</div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-3"><div className="h-3 w-72 rounded bg-gray-100" /><div className="mt-1 h-3 w-96 rounded bg-gray-100" /></div>
              ))}
            </div>
          </section>

          {/* University Essentials (UI-only) */}
          <section id="essentials" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">University Essentials</div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {['Portal','Calendar','Library','Printing','IT Help','Email','Housing','Transport'].map((t, i) => (
                <a key={i} href="#" className="grid place-items-center rounded-xl border bg-gray-50 p-4 text-sm text-gray-800 ring-1 ring-gray-200">{t}</a>
              ))}
            </div>
          </section>

          {/* Contributors Leaderboard (UI-only) */}
          <section id="contributors" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Top Contributors</div>
            <ul className="space-y-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm ring-1 ring-gray-200"><div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-gray-100" /><div className="h-3 w-32 rounded bg-gray-100" /></div><div className="h-3 w-20 rounded bg-gray-100" /></li>
              ))}
            </ul>
          </section>

          {/* Shoutouts Wall (UI-only) */}
          <section id="shoutouts" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Shoutouts</div>
            <div className="grid gap-2 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-3"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-amber-100" /><div className="h-3 w-48 rounded bg-gray-100" /></div><div className="mt-2 h-3 w-64 rounded bg-gray-100" /></div>
              ))}
            </div>
          </section>

          {/* Weekly Digest Preview (UI-only) */}
          <section id="digest" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Weekly Digest</div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border p-3"><div className="text-xs font-semibold text-gray-600">Last Week</div><div className="mt-2 h-3 w-56 rounded bg-gray-100" /><div className="mt-1 h-3 w-40 rounded bg-gray-100" /></div>
              <div className="rounded-xl border p-3"><div className="text-xs font-semibold text-gray-600">Coming Up</div><div className="mt-2 h-3 w-56 rounded bg-gray-100" /><div className="mt-1 h-3 w-40 rounded bg-gray-100" /></div>
              <div className="rounded-xl border p-3"><div className="text-xs font-semibold text-gray-600">Top Helpers</div><div className="mt-2 h-3 w-56 rounded bg-gray-100" /><div className="mt-1 h-3 w-40 rounded bg-gray-100" /></div>
            </div>
          </section>

          {/* Deck Catalog (UI-only) */}
          <section id="decks" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Deck Catalog</div>
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-3"><div className="h-3 w-52 rounded bg-gray-100" /><div className="mt-1 flex items-center gap-2 text-[11px]"><div className="h-5 w-16 rounded-full bg-gray-100" /><div className="h-5 w-16 rounded-full bg-gray-100" /></div><div className="mt-2 h-2 w-full rounded bg-gray-100" /></div>
              ))}
            </div>
          </section>

          {/* Practice Sets (UI-only) */}
          <section id="practice" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Practice Sets</div>
            <ul className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border px-3 py-2"><div className="space-y-1"><div className="h-3 w-60 rounded bg-gray-100" /><div className="flex gap-1"><div className="h-5 w-20 rounded-full bg-gray-100" /><div className="h-5 w-16 rounded-full bg-gray-100" /></div></div><div className="h-7 w-20 rounded-full bg-indigo-50 ring-1 ring-indigo-200" /></li>
              ))}
            </ul>
          </section>

          {/* Trending Topics (UI-only) */}
          <section id="trending" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Trending Topics</div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {['Nephron','ECG basics','Embryology','Pharmacokinetics','Brainstem','Immuno','Respiratory','Endocrine'].map((t, i) => (
                <span key={i} className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700 ring-1 ring-indigo-200">{t}</span>
              ))}
            </div>
          </section>

          {/* Help board (skeleton) */}
          <section id="help" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Help Board</div>
            <ul className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl border px-3 py-2"><Skeleton className="h-5 w-20 rounded-full" /><div className="flex-1 space-y-1"><Skeleton className="h-3 w-60 rounded" /><Skeleton className="h-3 w-24 rounded" /></div><Skeleton className="h-7 w-24 rounded-full" /></li>
              ))}
            </ul>
          </section>

          {/* Polls (skeleton) */}
          <section id="polls" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Quick Polls & Decisions</div>
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-3"><Skeleton className="h-3 w-64 rounded" /><div className="mt-2 space-y-2"><Skeleton className="h-8 w-full rounded-lg" /><Skeleton className="h-8 w-full rounded-lg" /><Skeleton className="h-8 w-full rounded-lg" /></div></div>
              ))}
            </div>
          </section>

          {/* Improvements (skeleton) */}
          <section id="improvements" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Course Improvement Board</div>
            <ul className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex items-center gap-2 rounded-xl border px-3 py-2"><Skeleton className="h-7 w-7 rounded-full" /><div className="flex-1 space-y-1"><Skeleton className="h-3 w-56 rounded" /><Skeleton className="h-3 w-24 rounded" /></div><Skeleton className="h-7 w-20 rounded-full" /></li>
              ))}
            </ul>
          </section>

          {/* Orgs */}
          <section id="orgs" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Student Organizations</div>
            {(!organizations || organizations.length === 0) ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-gray-700">No organizations yet.</div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {organizations.map((o) => (
                  <div key={o.id} className="rounded-xl border p-3">
                    <div className="font-semibold text-gray-900">{o.name}</div>
                    {o.description && <div className="mt-1 text-sm text-gray-700 line-clamp-2">{o.description}</div>}
                    <div className="mt-2">
                      {o.website && <a href={o.website} target="_blank" rel="noreferrer" className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">Website</a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Reps */}
          <section id="reps" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Representatives</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-semibold text-gray-600">Course Reps</div>
                <ul className="space-y-2">
                  {moderators.length === 0 ? (
                    <li className="text-sm text-gray-700">None yet.</li>
                  ) : moderators.map((m, i) => (
                    <li key={m.id || i} className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-700">{initials(m.name)}</div>
                      <div className="text-sm text-gray-900">{m.name || m.username || 'Moderator'}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-gray-600">University Reps</div>
                <ul className="space-y-2">
                  {uniModerators.length === 0 ? (
                    <li className="text-sm text-gray-700">None yet.</li>
                  ) : uniModerators.map((m, i) => (
                    <li key={m.id || i} className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-700">{initials(m.name)}</div>
                      <div className="text-sm text-gray-900">{m.name || m.username || 'Rep'}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Kudos (skeleton) */}
          <section id="kudos" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Kudos & Recognition</div>
            <ul className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (<li key={i} className="flex items-center gap-3 rounded-xl border px-3 py-2"><Skeleton className="h-8 w-8 rounded-full" /><div className="flex-1"><Skeleton className="h-3 w-56 rounded" /><Skeleton className="mt-1 h-3 w-40 rounded" /></div><Skeleton className="h-7 w-20 rounded-full" /></li>))}</ul>
          </section>

          {/* Settings (skeleton) */}
          <section id="settings" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 text-lg font-semibold">Settings</div>
            <div className="rounded-xl border bg-gray-50 p-3"><div className="flex items-center justify-between gap-4"><div><div className="h-3 w-40 rounded bg-gray-200" /><div className="mt-1 h-3 w-80 rounded bg-gray-100" /></div><Skeleton className="h-6 w-11 rounded-full" /></div></div>
          </section>
        </main>

        {/* Right rail scaffold */}
        <aside className="col-span-12 md:col-span-3">
          <div className="sticky top-6 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="mb-2 text-sm font-semibold">From recent events</div>
              <div className="grid grid-cols-3 gap-2">
                {(photos || []).slice(0,6).map((ph:any) => (
                  <img key={ph.id} src={ph.thumb_url || ph.url} alt={ph.caption || ''} className="aspect-square w-full rounded-lg object-cover" />
                ))}
                {(!photos || photos.length===0) && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full rounded-lg" />)}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="mb-2 text-sm font-semibold">Quick actions</div>
              <div className="grid gap-2">
                <a href="#invite" className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200">Invite classmates</a>
                <button onClick={()=>setShowHomepage(true)} className="rounded-lg bg-gray-50 px-3 py-2 text-left text-sm font-semibold text-gray-800 ring-1 ring-gray-200">Set as homepage</button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Homepage modal */}
      {showHomepage && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-2 flex items-center justify-between"><div className="text-lg font-semibold">Set as browser homepage</div><button onClick={()=>setShowHomepage(false)} className="grid h-7 w-7 place-items-center rounded-full bg-gray-100 text-gray-700">×</button></div>
            <div className="text-sm text-gray-700">Modern browsers do not allow websites to change your homepage automatically. To set this page manually:</div>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-gray-700">
              <li>Copy this URL: <span className="rounded bg-gray-100 px-1 py-0.5 text-xs">{typeof window!== 'undefined' ? window.location.origin + '/course-mates' : '/course-mates'}</span></li>
              <li>Chrome/Edge: Settings → On startup → Open a specific page → Add this URL.</li>
              <li>Firefox: Settings → Home → Homepage and new windows → Custom URLs.</li>
              <li>Safari: Safari → Settings → General → Homepage.</li>
            </ul>
            <div className="mt-3 text-right"><button onClick={()=>setShowHomepage(false)} className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">Got it</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
