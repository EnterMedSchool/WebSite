"use client";
import { useEffect, useMemo, useState } from "react";

type DashData = {
  user: { id: number; name?: string | null; image?: string | null; xp: number; level: number };
  learning: { minutesToday: number; minutesTotal: number; correctToday: number };
  chapters: { id: number; slug: string; title: string; course_slug: string; course_title: string }[];
  courses: { id: number; slug: string; title: string; description?: string | null }[];
};

export default function FloatingDashboard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const r = await fetch("/api/me/dashboard", { credentials: "include" });
        if (!r.ok) { setData(null); return; }
        const j = await r.json();
        setData(j as DashData);
      } finally { setLoading(false); }
    })();
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function completeLesson(lessonSlug: string) {
    try {
      const r = await fetch(`/api/lesson/${encodeURIComponent(lessonSlug)}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ completed: true })
      });
      if (!r.ok) return;
      const j = await r.json();
      const amount = Number(j?.awardedXp || 0);
      if (amount > 0 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('xp:awarded' as any, { detail: { amount, newLevel: j?.newLevel, newPct: j?.pct, newInLevel: j?.inLevel, newSpan: j?.span } }));
      }
      // Refresh dashboard data so progress updates
      const res = await fetch('/api/me/dashboard', { credentials: 'include' });
      if (res.ok) setData(await res.json());
    } catch {}
  }

  const firstName = useMemo(() => {
    const n = data?.user?.name || "there";
    const f = n.split(" ")[0]?.trim();
    return f || "there";
  }, [data]);

  const examName = "your exam"; // placeholder until profile step

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] grid place-items-center bg-gradient-to-br from-black/40 via-indigo-900/10 to-fuchsia-900/10 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-6xl rounded-[28px] border border-violet-200/60 bg-white/90 shadow-[0_30px_90px_rgba(99,102,241,0.35)] ring-1 ring-white/40 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left rail */}
        <div className="absolute left-0 top-0 h-full w-16 rounded-l-[28px] bg-gradient-to-b from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-[inset_-1px_0_0_rgba(255,255,255,0.3)]">
          <div className="flex h-full flex-col items-center justify-between py-5">
            <div className="space-y-4">
              {[
                { k: "home", c: "#ffffff" },
                { k: "book", c: "#dbeafe" },
                { k: "chart", c: "#fde68a" },
                { k: "user", c: "#bbf7d0" },
              ].map((x, i) => (
                <span key={i} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                  <span className="h-5 w-5 rounded-full" style={{ background: x.c }} />
                </span>
              ))}
            </div>
            <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30">A-</button>
          </div>
        </div>

        {/* Main content */}
        <div className="pl-16">
          <div className="grid grid-cols-12 gap-6 p-6">
            {/* Greeting and Today\'s course */}
            <div className="col-span-7">
              <div className="rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-[0_10px_30px_rgba(99,102,241,0.12)]">
                <div className=" text-[26px] font-extrabold tracking-tight text-gray-900\>Hello, {firstName} ??</div>
                <div className="mt-1 text-[13px] text-gray-600">Nice to have you back, let&apos;s continue preparing for your exam.</div>

                <div className="mt-5 text-base font-bold text-gray-800">Today&apos;s course</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {(data?.chapters?.length ? data.chapters : []).slice(0, 2).map((ch) => (
                    <div key={ch.id} className="flex flex-col justify-between rounded-2xl border border-gray-100 p-4 shadow-[0_10px_22px_rgba(0,0,0,0.06)]">
                      <div>
                        <div className="text-sm font-semibold text-indigo-700">{ch.course_title}</div>
                        <div className="mt-1 line-clamp-2 text-base font-bold text-gray-900">{ch.title}</div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 shadow-sm">{typeof (ch as any).progress_pct === 'number' ? `${Math.round((ch as any).progress_pct)}% done` : 'In progress'}</span>
                          <span className="opacity-60">-</span>
                          <span>{(ch as any).total_min != null && (ch as any).total_min > 0 ? `${(ch as any).total_min} min` : '-'}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <a href={(ch as any).continue_slug ? `/lesson/${encodeURIComponent((ch as any).continue_slug)}` : `/course/${encodeURIComponent(ch.course_slug)}`} className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:opacity-95">Learn</a>
                        <button onClick={() => (ch as any).continue_slug && completeLesson((ch as any).continue_slug)} className="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Complete</button>
                      </div>
                    </div>
                  ))}
                  {!loading && (data?.chapters?.length ?? 0) === 0 && (
                    <div className="col-span-2 rounded-2xl border border-dashed border-indigo-200/70 bg-indigo-50/30 p-6 text-sm text-gray-600">
                      No recent chapters yet. Start a lesson to see suggestions here.
                    </div>
                  )}
                </div>
              </div>

              {/* Learning activity */}
              <div className="mt-6 rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-[0_10px_30px_rgba(99,102,241,0.10)]">
                <div className="text-base font-bold text-gray-800">Learning activity</div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl border p-4 shadow-sm">
                    <div className="text-2xl font-extrabold text-indigo-700">{data?.learning?.minutesToday ?? (loading ? "…" : 0)}m</div>
                    <div className="text-xs text-gray-600">Studied today</div>
                  </div>
                  <div className="rounded-2xl border p-4 shadow-sm">
                    <div className="text-2xl font-extrabold text-indigo-700">{data?.learning?.minutesTotal ?? (loading ? "…" : 0)}m</div>
                    <div className="text-xs text-gray-600">Total minutes</div>
                  </div>
                  <div className="rounded-2xl border p-4 shadow-sm">
                    <div className="text-2xl font-extrabold text-indigo-700">{data?.learning?.correctToday ?? (loading ? "…" : 0)}</div>
                    <div className="text-xs text-gray-600">Correct today</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Profile + XP cards */}
            <div className="col-span-5 space-y-4">
              {/* Profile */}
              <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white/90 shadow-[0_10px_30px_rgba(99,102,241,0.10)]">
                <div className="relative h-28 w-full bg-gradient-to-r from-indigo-200 via-violet-200 to-fuchsia-200" />
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-indigo-100">
                      {data?.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={data.user.image} alt="User" className="h-12 w-12 object-cover" />
                      ) : (
                        <span className="text-base font-semibold text-indigo-700">{firstName.slice(0,1).toUpperCase()}</span>
                      )}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900">{data?.user?.name ?? "Your Name"}</div>
                      <button className="text-xs font-semibold text-indigo-700 underline" onClick={() => alert("Profile editing coming soon")}>Edit profile</button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl border p-2">
                      <div className="text-lg font-extrabold text-gray-900">{data?.user?.level ?? 1}</div>
                      <div className="text-gray-600">Level</div>
                    </div>
                    <div className="rounded-xl border p-2">
                      <div className="text-lg font-extrabold text-gray-900">{data?.user?.xp ?? 0}</div>
                      <div className="text-gray-600">XP</div>
                    </div>
                    <div className="rounded-xl border p-2">
                      <div className="text-lg font-extrabold text-gray-900">{(data?.user as any)?.streakDays ?? '-'}</div>
                      <div className="text-gray-600">Streak</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* XP / Activity section */}
              <div className="rounded-3xl border border-gray-100 bg-white/90 p-5 shadow-[0_10px_30px_rgba(99,102,241,0.10)]">
                <div className="mb-2 flex items-baseline justify-between">
                  <div>
                    <div className="text-sm text-gray-700">Total XP</div>
                    <div className="text-2xl font-extrabold text-indigo-700">{data?.user?.xp ?? 0} <span className="text-indigo-800">XP</span></div>
                  </div>
                  <div className="text-xs text-gray-600">Last 7 days</div>
                </div>
                <MiniChart series={(data as any)?.series} />
              </div>
            </div>

            {/* Your class */}
            <div className="col-span-12">
              <div className="rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-[0_10px_30px_rgba(99,102,241,0.10)]">
                <div className="text-base font-bold text-gray-800">Your class</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {(data?.courses || []).map((c) => (
                    <a key={c.id} href={`/course/${encodeURIComponent(c.slug)}`} className="flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-[1px] hover:bg-indigo-50/40">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-200 to-fuchsia-200 shadow-inner" />
                      <div>
                        <div className="font-semibold text-gray-900">{c.title}</div>
                        <div className="text-xs text-gray-600 line-clamp-1">{c.description || "-"}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniChart({ series }: { series?: { labels: string[]; xp7: number[]; min7: number[]; corr7: number[] } | null }) {
  if (!series || !series.labels) {
    return <div className="h-28 w-full animate-pulse rounded-xl bg-gray-100" /> as any;
  }
  const labels = series.labels;
  const xp = series.xp7 || [];
  const mn = series.min7 || [];
  const cr = series.corr7 || [];
  const maxY = Math.max(10, ...xp, ...mn, ...cr);
  const W = 360, H = 120, P = 18; // width, height, padding
  const n = labels.length;
  const x = (i: number) => P + (i * (W - 2 * P)) / Math.max(1, n - 1);
  const y = (v: number) => H - P - (v / maxY) * (H - 2 * P);
  const line = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#fcd34d" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <g>
          <path d={line(mn)} fill="none" stroke="url(#g2)" strokeWidth="3" />
          <path d={line(xp)} fill="none" stroke="url(#g1)" strokeWidth="3" />
          <path d={line(cr)} fill="none" stroke="url(#g3)" strokeWidth="3" />
        </g>
        <g fontSize="8" fill="#6b7280">
          {labels.map((lb, i) => (
            <text key={i} x={x(i)} y={H - 4} textAnchor="middle">{lb.split(' ')[1]}</text>
          ))}
        </g>
      </svg>
      <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-gray-600">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-indigo-500" /> XP</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-emerald-500" /> Minutes</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-amber-500" /> Correct</span>
      </div>
    </div>
  ) as any;
}

"use client";

import { useEffect, useMemo, useState, useRef } from "react";

type Series = { labels: string[]; xp7: number[]; min7: number[]; corr7: number[] };
type ChapterCard = { id: number; slug: string; title: string; course_slug: string; course_title: string; total_min?: number | null; progress_pct?: number | null; continue_slug?: string | null; continue_completed?: boolean | null };
type DashData = {
  user: { id: number; name?: string | null; image?: string | null; xp: number; level: number; streakDays?: number };
  learning: { minutesToday: number; minutesTotal: number; correctToday: number };
  chapters: ChapterCard[];
  courses: { id: number; slug: string; title: string; description?: string | null }[];
  series?: Series;
};

export default function FloatingDashboard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try { const r = await fetch("/api/me/dashboard", { credentials: "include" }); setData(r.ok ? await r.json() : null); }
      finally { setLoading(false); }
    })();
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const firstName = useMemo(() => {
    const n = data?.user?.name || "there"; const f = n.split(" ")[0]?.trim(); return f || "there";
  }, [data]);

  if (!open) return null;

  async function completeLesson(lessonSlug: string) {
    try {
      const r = await fetch(`/api/lesson/${encodeURIComponent(lessonSlug)}/progress`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ completed: true }) });
      if (!r.ok) return; const j = await r.json();
      const amount = Number(j?.awardedXp || 0);
      if (amount > 0) {
        window.dispatchEvent(new CustomEvent('xp:awarded' as any, { detail: { amount, newLevel: j?.newLevel, newPct: j?.pct, newInLevel: j?.inLevel, newSpan: j?.span } }));
      }
      const res = await fetch('/api/me/dashboard', { credentials: 'include' }); if (res.ok) setData(await res.json());
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-[9998] grid place-items-center bg-gradient-to-br from-black/40 via-indigo-900/10 to-fuchsia-900/10 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div className="relative w-full max-w-6xl rounded-[28px] border border-violet-200/60 bg-white/90 shadow-[0_30px_90px_rgba(99,102,241,0.35)] ring-1 ring-white/40 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
        {/* Left rail */}
        <div className="absolute left-0 top-0 h-full w-16 rounded-l-[28px] bg-gradient-to-b from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-[inset_-1px_0_0_rgba(255,255,255,0.3)]">
          <div className="flex h-full flex-col items-center justify-between py-5">
            <div className="space-y-4">
              {['#ffffff', '#dbeafe', '#fde68a', '#bbf7d0'].map((c, i) => (
                <span key={i} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                  <span className="h-5 w-5 rounded-full" style={{ background: c }} />
                </span>
              ))}
            </div>
            <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30">A-</button>
          </div>
        </div>

        {/* Main content */}
        <div className="pl-16">
          <div className="grid grid-cols-12 gap-6 p-6">
            {/* Greeting + Today */}
            <div className="col-span-7">
              <div className="rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-[0_10px_30px_rgba(99,102,241,0.12)]">
                <div className="text-[26px] font-extrabold tracking-tight text-gray-900">Hello, {firstName} 👋</div>
                <div className="mt-1 text-[13px] text-gray-600">Nice to have you back, let&apos;s continue preparing for your exam.</div>
                <div className="mt-5 text-base font-bold text-gray-800">Today&apos;s course</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {(data?.chapters ?? []).slice(0, 2).map((ch) => (
                    <div key={ch.id} className="relative flex flex-col justify-between rounded-2xl border border-gray-100 p-4 shadow-[0_10px_22px_rgba(0,0,0,0.06)]">
                      <div>
                        <div className="absolute -left-3 -top-3 h-8 w-8 rounded-full bg-white shadow" style={{ background: `conic-gradient(#6366f1 ${Math.max(0, Math.min(100, Math.round(ch.progress_pct ?? 0)))}%, #e5e7eb 0)` }}>
                          <div className="absolute inset-1 rounded-full bg-white" />
                        </div>
                        <div className="text-sm font-semibold text-indigo-700">{ch.course_title}</div>
                        <div className="mt-1 line-clamp-2 text-base font-bold text-gray-900">{ch.title}</div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 shadow-sm">{typeof ch.progress_pct === 'number' ? `${Math.round(ch.progress_pct)}% done` : 'In progress'}</span>
                          <span className="opacity-60">-</span>
                          <span>{(ch.total_min ?? 0) > 0 ? `${ch.total_min} min` : '-'}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <a href={ch.continue_slug ? `/lesson/${encodeURIComponent(ch.continue_slug)}` : `/course/${encodeURIComponent(ch.course_slug)}`} className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:opacity-95">Learn</a>
                        <button disabled={!ch.continue_slug || !!ch.continue_completed} onClick={() => ch.continue_slug && completeLesson(ch.continue_slug)} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${ch.continue_completed ? 'border border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{ch.continue_completed ? 'Completed' : 'Complete'}</button>
                      </div>
                    </div>
                  ))}
                  {!loading && ((data?.chapters?.length ?? 0) === 0) && (
                    <div className="col-span-2 rounded-2xl border border-dashed border-indigo-200/70 bg-indigo-50/30 p-6 text-sm text-gray-600">No recent chapters yet. Start a lesson to see suggestions here.</div>
                  )}
                </div>
              </div>

              {/* Learning activity */}
              <div className="mt-6 rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-[0_10px_30px_rgba(99,102,241,0.10)]">
                <div className="text-base font-bold text-gray-800">Learning activity</div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl border p-4 shadow-sm"><div className="text-2xl font-extrabold text-indigo-700">{data?.learning?.minutesToday ?? (loading ? '…' : 0)}m</div><div className="text-xs text-gray-600">Studied today</div></div>
                  <div className="rounded-2xl border p-4 shadow-sm"><div className="text-2xl font-extrabold text-indigo-700">{data?.learning?.minutesTotal ?? (loading ? '…' : 0)}m</div><div className="text-xs text-gray-600">Total minutes</div></div>
                  <div className="rounded-2xl border p-4 shadow-sm"><div className="text-2xl font-extrabold text-indigo-700">{data?.learning?.correctToday ?? (loading ? '…' : 0)}</div><div className="text-xs text-gray-600">Correct today</div></div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="col-span-5 space-y-4">
              {/* Profile */}
              <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white/90 shadow-[0_10px_30px_rgba(99,102,241,0.10)]">
                <div className="relative h-28 w-full bg-gradient-to-r from-indigo-200 via-violet-200 to-fuchsia-200" />
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-indigo-100">
                      {data?.user?.image ? (<img src={data.user.image} alt="User" className="h-12 w-12 object-cover" />) : (<span className="text-base font-semibold text-indigo-700">{firstName.slice(0,1).toUpperCase()}</span>)}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900">{data?.user?.name ?? "Your Name"}</div>
                      <button className="text-xs font-semibold text-indigo-700 underline" onClick={() => alert("Profile editing coming soon")}>Edit profile</button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl border p-2"><div className="text-lg font-extrabold text-gray-900">{data?.user?.level ?? 1}</div><div className="text-gray-600">Level</div></div>
                    <div className="rounded-xl border p-2"><div className="text-lg font-extrabold text-gray-900">{data?.user?.xp ?? 0}</div><div className="text-gray-600">XP</div></div>
                    <div className="rounded-xl border p-2"><div className="text-lg font-extrabold text-gray-900">{data?.user?.streakDays ?? '-'}</div><div className="text-gray-600">Streak</div></div>
                  </div>
                </div>
              </div>

              {/* XP / Activity */}
              <div className="rounded-3xl border border-gray-100 bg-white/90 p-5 shadow-[0_10px_30px_rgba(99,102,241,0.10)]">
                <div className="mb-2 flex items-baseline justify-between">
                  <div>
                    <div className="text-sm text-gray-700">Total XP</div>
                    <div className="text-2xl font-extrabold text-indigo-700">{data?.user?.xp ?? 0} <span className="text-indigo-800">XP</span></div>
                  </div>
                  <div className="text-xs text-gray-600">Last 7 days</div>
                </div>
                <MiniChart series={data?.series} />
              </div>
            </div>

            {/* Courses */}
            <div className="col-span-12">
              <div className="rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-[0_10px_30px_rgba(99,102,241,0.10)]">
                <div className="text-base font-bold text-gray-800">Your class</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {(data?.courses || []).map((c) => (
                    <a key={c.id} href={`/course/${encodeURIComponent(c.slug)}`} className="flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-[1px] hover:bg-indigo-50/40">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-200 to-fuchsia-200 shadow-inner" />
                      <div>
                        <div className="font-semibold text-gray-900">{c.title}</div>
                        <div className="text-xs text-gray-600 line-clamp-1">{c.description || '-'}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniChart({ series }: { series?: Series | null }) {
  const [showXp, setShowXp] = useState(true);
  const [showMin, setShowMin] = useState(true);
  const [showCorr, setShowCorr] = useState(true);
  const [idx, setIdx] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  if (!series || !series.labels) return <div className="h-28 w-full animate-pulse rounded-xl bg-gray-100" />;

  const labels = series.labels, xp = series.xp7, mn = series.min7, cr = series.corr7;
  const maxY = Math.max(10, ...(showXp ? xp : [0]), ...(showMin ? mn : [0]), ...(showCorr ? cr : [0]));
  const W = 360, H = 120, P = 18; const n = labels.length;
  const xi = (i: number) => P + (i * (W - 2 * P)) / Math.max(1, n - 1);
  const yi = (v: number) => H - P - (v / maxY) * (H - 2 * P);
  const path = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${xi(i)},${yi(v)}`).join(' ');

  function onMove(e: React.MouseEvent) {
    const r = wrapRef.current?.getBoundingClientRect(); if (!r) return;
    const rel = Math.max(P, Math.min(W - P, e.clientX - r.left));
    const t = (rel - P) / (W - 2 * P); const j = Math.round(t * (n - 1)); setIdx(Math.max(0, Math.min(n - 1, j)));
  }

  const activeX = idx != null ? xi(idx) : null;
  const tip = idx != null ? { day: labels[idx], xp: xp[idx], min: mn[idx], corr: cr[idx] } : null;

  return (
    <div ref={wrapRef} className="relative select-none" onMouseMove={onMove} onMouseLeave={() => setIdx(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" /><stop offset="100%" stopColor="#a78bfa" stopOpacity="0.2" /></linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.8" /><stop offset="100%" stopColor="#34d399" stopOpacity="0.2" /></linearGradient>
          <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" /><stop offset="100%" stopColor="#fcd34d" stopOpacity="0.2" /></linearGradient>
        </defs>
        {showMin && <path d={path(mn)} fill="none" stroke="url(#g2)" strokeWidth="3" />}
        {showXp && <path d={path(xp)} fill="none" stroke="url(#g1)" strokeWidth="3" />}
        {showCorr && <path d={path(cr)} fill="none" stroke="url(#g3)" strokeWidth="3" />}
        {activeX != null && <line x1={activeX} y1={P} x2={activeX} y2={H - P} stroke="#94a3b8" strokeDasharray="3,3" />}
      </svg>
      {tip && (
        <div className="pointer-events-none absolute -translate-x-1/2 rounded-xl border bg-white/95 px-2 py-1 text-[10px] shadow" style={{ left: `${activeX! / 3.6}%`, top: 0 }}>
          <div className="font-semibold text-gray-800">{tip.day}</div>
          <div className="mt-0.5 grid grid-cols-3 gap-2">
            <span className="text-indigo-600">{tip.xp} XP</span>
            <span className="text-emerald-600">{tip.min}m</span>
            <span className="text-amber-600">{tip.corr}</span>
          </div>
        </div>
      )}
      <div className="mt-2 flex items-center justify-center gap-2 text-[10px]">
        <button onClick={() => setShowXp(v=>!v)} className={`rounded-full px-2 py-0.5 ${showXp ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>XP</button>
        <button onClick={() => setShowMin(v=>!v)} className={`rounded-full px-2 py-0.5 ${showMin ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>Minutes</button>
        <button onClick={() => setShowCorr(v=>!v)} className={`rounded-full px-2 py-0.5 ${showCorr ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>Correct</button>
      </div>
    </div>
  );
}
