"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from 'react';

// Types for dashboard payload
type Series = { labels: string[]; xp7: number[]; min7: number[]; corr7: number[]; tasks7?: number[] };
type ChapterCard = {
  id: number;
  slug: string;
  title: string;
  course_slug: string;
  course_title: string;
  total_min?: number | null;
  progress_pct?: number | null;
  continue_slug?: string | null;
  continue_completed?: boolean | null;
};
type DashData = {
  user: { id: number; name?: string | null; image?: string | null; xp: number; level: number; streakDays?: number };
  learning: { minutesToday: number; minutesTotal: number; correctToday: number; tasksToday?: number };
  chapters: ChapterCard[];
  courses: { id: number; slug: string; title: string; description?: string | null; progress_pct?: number | null }[];
  series?: Series;
};

export default function FloatingDashboard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(false);
  const [mates, setMates] = useState<{ count: number; course?: string | null; school?: string | null; year?: number | null; activeNow?: number | null; isVerified?: boolean } | null>(null);

  // Load dashboard when opened
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const r = await fetch("/api/me/dashboard", { credentials: "include" });
        setData(r.ok ? await r.json() : null);
      } finally { setLoading(false); }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const r = await fetch('/api/course-mates/summary', { credentials: 'include' });
        if (!r.ok) return;
        const j = await r.json();
        setMates({ count: Number(j?.matesCount || 0), course: j?.courseName || null, school: j?.schoolName || null, year: j?.studyYear || null, activeNow: Number(j?.activeNow || 0), isVerified: !!j?.isVerified });
      } catch {}
    })();
  }, [open]);

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const firstName = useMemo(() => {
    const n = data?.user?.name || "there"; return (n.split(" ")[0] || "there").trim();
  }, [data]);

  if (!open) return null;

  async function completeLesson(lessonSlug: string) {
    try {
      const r = await fetch(`/api/lesson/${encodeURIComponent(lessonSlug)}/progress`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ completed: true })
      });
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
                <span key={i} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20"><span className="h-5 w-5 rounded-full" style={{ background: c }} /></span>
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
                <div className="flex items-center gap-3">
                  <div className="text-[26px] font-extrabold tracking-tight text-gray-900">Hello, {firstName}</div>
                  <img
                    src="https://entermedschool.com/wp-content/uploads/2025/09/LeoHi.png"
                    alt="Leo waving hello"
                    className="h-10 w-auto select-none"
                    loading="eager"
                    decoding="async"
                  />
                </div>
                <div className="mt-1 text-[13px] text-gray-600">Nice to have you back, let&apos;s continue preparing for your exam.</div>
                {/* Today KPI pills */}
                <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                  <DashPill color="indigo" label="XP (24h)" value={`+${data?.series?.xp7?.[(data?.series?.xp7?.length||1)-1] ?? 0}`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M12 2 15 8l6 .9-4.5 4 1 6.1L12 16l-5.5 3 1-6.1L3 8.9 9 8z"/></svg>
                  </DashPill>
                  <DashPill color="emerald" label="Minutes" value={`${data?.learning?.minutesToday ?? 0}m`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 10V7h-2v7h6v-2Z"/></svg>
                  </DashPill>
                  <DashPill color="amber" label="Correct" value={`${data?.learning?.correctToday ?? 0}`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4Z"/></svg>
                  </DashPill>
                  <DashPill color="sky" label="Tasks" value={`${data?.learning?.tasksToday ?? 0}`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M3 5h18v2H3V5m0 6h18v2H3v-2m0 6h18v2H3v-2z"/></svg>
                  </DashPill>
                </div>
                <div className="mt-5 text-base font-bold text-gray-800">Latest chapters</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {loading ? (
                    [0,1].map((i) => (
                      <div key={i} className="relative rounded-2xl p-[2px] min-h-[148px]" style={{ background: 'conic-gradient(#e5e7eb 0, #e5e7eb 0)' }}>
                        <div className="flex h-full flex-col justify-between rounded-[14px] border border-gray-100 bg-white p-4 shadow-[0_10px_22px_rgba(0,0,0,0.06)]">
                          <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
                          <div className="mt-2 h-5 w-64 animate-pulse rounded bg-gray-100" />
                          <div className="mt-3 h-3 w-32 animate-pulse rounded bg-gray-100" />
                        </div>
                      </div>
                    ))
                  ) : (data?.chapters ?? []).slice(0, 2).map((ch) => (
                    <div key={ch.id} className="relative rounded-2xl p-[2px]" style={{ background: `conic-gradient(${(ch.progress_pct ?? 0) >= 100 ? '#10b981' : '#6366f1'} ${Math.max(0, Math.min(100, Math.round(ch.progress_pct ?? 0)))}%, #e5e7eb 0)` }}>
                      <div className="flex h-full flex-col justify-between rounded-[14px] border border-gray-100 bg-white p-4 shadow-[0_10px_22px_rgba(0,0,0,0.06)]">
                        <div className="text-sm font-semibold text-indigo-700">{ch.course_title}</div>
                        <div className="mt-1 line-clamp-2 text-base font-bold text-gray-900">{ch.title}</div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 shadow-sm">{typeof ch.progress_pct === 'number' ? `${Math.round(ch.progress_pct)}% done` : 'In progress'}</span>
                          <span className="opacity-60">-</span>
                          <span>{(ch.total_min ?? 0) > 0 ? `${ch.total_min} min` : '-'}</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <a href={ch.continue_slug ? `/lesson/${encodeURIComponent(ch.continue_slug)}` : `/course/${encodeURIComponent(ch.course_slug)}`} className="rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:opacity-95">Learn</a>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!loading && ((data?.chapters?.length ?? 0) === 0) && (
                    <div className="col-span-2 rounded-2xl border border-dashed border-indigo-200/70 bg-indigo-50/30 p-6 text-sm text-gray-600">No recent chapters yet. Start a lesson to see suggestions here.</div>
                  )}
                </div>
              </div>

              {/* Course Mates summary / CTA */}
              <div className="mt-6 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-fuchsia-50 p-6 shadow-[0_10px_30px_rgba(99,102,241,0.10)] min-h-[140px]">
                {mates && (mates.isVerified || mates.year || mates.course) ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-indigo-800">Your Course Mates</div>
                        <div className="text-xs text-gray-700">{mates.course || 'Course'} {mates.year ? `- Year ${mates.year}` : ''}{mates.school ? ` - ${mates.school}` : ''}</div>
                      </div>
                      <a href="/course-mates" className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-700">Open</a>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-2xl border border-indigo-100 bg-white/70 p-4 shadow-sm"><div className="text-xl font-extrabold text-indigo-700">{mates.count}</div><div className="text-[11px] text-gray-600">Mates verified</div></div>
                      <div className="rounded-2xl border border-indigo-100 bg-white/70 p-4 shadow-sm"><div className="text-xl font-extrabold text-emerald-700">{mates.activeNow ?? 0}</div><div className="text-[11px] text-gray-600">Active last 24h</div></div>
                      <div className="rounded-2xl border border-indigo-100 bg-white/70 p-4 shadow-sm"><div className="text-xl font-extrabold text-amber-700">{data?.user?.streakDays ?? 0}</div><div className="text-[11px] text-gray-600">Your streak</div></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold text-gray-900">Find your course mates</div>
                      <div className="mt-1 text-xs text-gray-700">Sync your profile with your university and year to join your class.</div>
                    </div>
                    <a href="/course-mates" className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-700">Sync profile</a>
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="col-span-5 space-y-4">
              {/* Profile */}
              <ProfileCard name={data?.user?.name ?? null} imageUrl={data?.user?.image ?? null} level={data?.user?.level ?? 1} xp={data?.user?.xp ?? 0} streakDays={data?.user?.streakDays ?? 0} />

              {/* XP / Activity */}
              <div className="rounded-3xl border border-gray-100 bg-white/90 p-5 shadow-[0_10px_30px_rgba(99,102,241,0.10)]">
                <div className="mb-2 flex items-baseline justify-between"><div><div className="text-sm text-gray-700">Total XP</div><div className="text-2xl font-extrabold text-indigo-700">{data?.user?.xp ?? 0} <span className="text-indigo-800">XP</span></div></div><div className="text-xs text-gray-600">Last 7 days</div></div>
                <MiniChart series={data?.series} />
              </div>
            </div>

            {/* Courses */}
            <div className="col-span-12">
              <div className="rounded-3xl border border-gray-100 bg-white/90 p-6 shadow-[0_10px_30px_rgba(99,102,241,0.10)]">
                <div className="text-base font-bold text-gray-800">Your Relevant Courses</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {(data?.courses || []).map((c) => {
                    const pct = Math.max(0, Math.min(100, Math.round(Number(c.progress_pct ?? 0))));
                    const col = pct >= 100 ? '#10b981' : '#6366f1';
                    return (
                      <div key={c.id} className="relative rounded-2xl p-[2px] min-h-[76px]" style={{ background: `conic-gradient(${col} ${pct}%, #e5e7eb 0)` }}>
                        <a href={`/course/${encodeURIComponent(c.slug)}`} className="flex min-h-[72px] items-center gap-3 rounded-[14px] border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-[1px] hover:bg-indigo-50/40">
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-200 to-fuchsia-200 shadow-inner" />
                          <div>
                            <div className="font-semibold text-gray-900">{c.title}</div>
                            <div className="text-xs text-gray-600 line-clamp-1">{c.description || '-'}</div>
                          </div>
                        </a>
                      </div>
                    );
                  })}
                </div>
                <div className="hidden">
                  <a href="/course-mates" className="flex items-center justify-between rounded-2xl border border-indigo-200/70 bg-indigo-50/60 px-4 py-3 text-indigo-800 transition hover:bg-indigo-50">
                    <div>
                      <div className="text-sm font-semibold">Your Course Mates</div>
                      <div className="text-xs opacity-80">{mates ? (mates.year && mates.course ? `${mates.count} mates â€¢ ${mates.course} â€¢ Year ${mates.year}` : `${mates.count} mates â€¢ set course & year`) : 'Discover classmates by course'}</div>
                    </div>
                    <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15-5-5 1.41-1.41L13 13.17l4.59-4.58L19 10Z"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ name, imageUrl, level, xp, streakDays }: { name: string | null; imageUrl: string | null; level: number; xp: number; streakDays: number }) {
  const [recent, setRecent] = useState<{ when: string; what: string; amount: number }[] | null>(null);
  const [rewards, setRewards] = useState<{ key: string; type: string; label: string; earnedAt: string }[] | null>(null);
  useEffect(() => {
    (async () => {
      try { const r = await fetch('/api/me/xp', { credentials: 'include' }); if (r.ok) { const j = await r.json(); setRecent((j?.recent || []).slice(0,6)); setRewards((j?.rewards || []).slice(0,6)); } else { setRecent([]); setRewards([]);} } catch { setRecent([]); setRewards([]);} })();
  }, []);
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white/90 shadow-[0_10px_30px_rgba(99,102,241,0.10)]">
      <div className="relative h-28 w-full bg-gradient-to-r from-indigo-200 via-violet-200 to-fuchsia-200" />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-indigo-100">{imageUrl ? (<img src={imageUrl} alt="User" className="h-12 w-12 object-cover" />) : (<span className="text-base font-semibold text-indigo-700">{(name||'U').slice(0,1).toUpperCase()}</span>)}</span>
          <div>
            <div className="font-semibold text-gray-900">{name ?? 'Your Name'}</div>
            <a href="/me/profile" className="text-xs font-semibold text-indigo-700 underline">Edit profile</a>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded-xl border p-2"><div className="text-lg font-extrabold text-gray-900">{level}</div><div className="text-gray-600">Level</div></div>
          <div className="rounded-xl border p-2"><div className="text-lg font-extrabold text-gray-900">{xp}</div><div className="text-gray-600">XP</div></div>
          <div className="rounded-xl border p-2"><div className="text-lg font-extrabold text-gray-900">{streakDays || '-'}</div><div className="text-gray-600">Streak</div></div>
          <div className="rounded-xl border p-2"><div className="text-lg font-extrabold text-gray-900">{Array.isArray(rewards)?rewards.length:'-'}</div><div className="text-gray-600">Items</div></div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-xs font-semibold text-gray-700">Recent XP</div>
            {recent === null ? (
              <div className="h-10 animate-pulse rounded bg-gray-100" />
            ) : recent.length === 0 ? (
              <div className="text-xs text-gray-600">No XP yet. Complete a lesson to earn some!</div>
            ) : (
              <ul className="space-y-1">
                {recent.map((r,i)=> (
                  <li key={i} className="flex items-center justify-between text-xs text-gray-800"><span className="truncate pr-2">{r.what}</span><span className="text-gray-500">{r.when}</span><span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">+{r.amount}</span></li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-gray-700">Inventory</div>
            {rewards === null ? (
              <div className="h-10 animate-pulse rounded bg-gray-100" />
            ) : rewards.length === 0 ? (
              <div className="text-xs text-gray-600">You don&#39;t have items yet.</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {rewards.map((rw,i)=> (
                  <span key={rw.key} className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-50 to-fuchsia-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-200/70">{rw.label}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashPill({ color, label, value, children }: { color: 'indigo'|'emerald'|'amber'|'sky'; label: string; value: string; children: ReactNode }) {
  const [popKey, setPopKey] = useState(0);
  const prev = useRef<string | null>(null);
  useEffect(() => {
    if (prev.current !== null && prev.current !== value) setPopKey((k) => k + 1);
    prev.current = value;
  }, [value]);
  const theme = color === 'indigo'
    ? { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200' }
    : color === 'emerald'
    ? { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' }
    : color === 'amber'
    ? { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' }
    : { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200' };
  return (
    <div className={`min-w-0 flex items-center justify-between overflow-hidden rounded-2xl border ${theme.ring} ${theme.bg} px-3 py-2`}>
      <div className={`min-w-0 flex items-center gap-2 ${theme.text}`}>
        <span className="shrink-0">{children}</span>
        <div className="min-w-0 truncate font-semibold">{label}</div>
      </div>
      <div key={popKey} className={`shrink-0 whitespace-nowrap text-[11px] font-extrabold tabular-nums ${theme.text}`} style={{ animation: 'pop 260ms cubic-bezier(.22,1,.36,1)' }}>{value}</div>
      <style>{`@keyframes pop { 0% { transform: scale(1) } 30% { transform: scale(1.08) } 100% { transform: scale(1) } }`}</style>
    </div>
  );
}

function MiniChart({ series }: { series?: Series | null }) {
  const [showXp, setShowXp] = useState(true);
  const [showMin, setShowMin] = useState(true);
  const [showCorr, setShowCorr] = useState(true);
  const [showTasks, setShowTasks] = useState(false);
  const [idx, setIdx] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  if (!series || !series.labels) return <div className="h-28 w-full animate-pulse rounded-xl bg-gray-100" />;

  const labels = series.labels, xp = series.xp7, mn = series.min7, cr = series.corr7, tk = series.tasks7 || new Array(series.labels.length).fill(0);
  const maxY = Math.max(10, ...(showXp ? xp : [0]), ...(showMin ? mn : [0]), ...(showCorr ? cr : [0]), ...(showTasks ? tk : [0]));
  const W = 360, H = 120, P = 18; const n = labels.length;
  const xi = (i: number) => P + (i * (W - 2 * P)) / Math.max(1, n - 1);
  const yi = (v: number) => H - P - (v / maxY) * (H - 2 * P);
  const path = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${xi(i)},${yi(v)}`).join(' ');

  function onMove(e: React.MouseEvent) {
    const r = ref.current?.getBoundingClientRect(); if (!r) return;
    const rel = Math.max(P, Math.min(W - P, e.clientX - r.left));
    const t = (rel - P) / (W - 2 * P); const j = Math.round(t * (n - 1)); setIdx(Math.max(0, Math.min(n - 1, j)));
  }
  const ax = idx != null ? xi(idx) : null;
  const tip = idx != null ? { day: labels[idx], xp: xp[idx], min: mn[idx], corr: cr[idx], tasks: tk[idx] } : null;

  return (
    <div ref={ref} className="relative select-none" onMouseMove={onMove} onMouseLeave={() => setIdx(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" /><stop offset="100%" stopColor="#a78bfa" stopOpacity="0.2" /></linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.8" /><stop offset="100%" stopColor="#34d399" stopOpacity="0.2" /></linearGradient>
          <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" /><stop offset="100%" stopColor="#fcd34d" stopOpacity="0.2" /></linearGradient>
        </defs>
        <defs>
          <linearGradient id="g4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.8" /><stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" /></linearGradient>
        </defs>
        {showMin && <path d={path(mn)} fill="none" stroke="url(#g2)" strokeWidth="3" />}
        {showXp && <path d={path(xp)} fill="none" stroke="url(#g1)" strokeWidth="3" />}
        {showCorr && <path d={path(cr)} fill="none" stroke="url(#g3)" strokeWidth="3" />}
        {showTasks && <path d={path(tk)} fill="none" stroke="url(#g4)" strokeWidth="3" />}
        {ax != null && <line x1={ax} y1={P} x2={ax} y2={H - P} stroke="#94a3b8" strokeDasharray="3,3" />}
      </svg>
      {tip && (
        <div className="pointer-events-none absolute -translate-x-1/2 rounded-xl border bg-white/95 px-2 py-1 text-[10px] shadow" style={{ left: `${ax! / 3.6}%`, top: 0 }}>
          <div className="font-semibold text-gray-800">{tip.day}</div>
          <div className="mt-0.5 grid grid-cols-4 gap-2"><span className="text-indigo-600">{tip.xp} XP</span><span className="text-emerald-600">{tip.min}m</span><span className="text-amber-600">{tip.corr}</span><span className="text-sky-600">{tip.tasks}</span></div>
        </div>
      )}
      <div className="mt-2 flex items-center justify-center gap-2 text-[10px]">
        <button onClick={() => setShowXp(v=>!v)} className={`rounded-full px-2 py-0.5 ${showXp ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>XP</button>
        <button onClick={() => setShowMin(v=>!v)} className={`rounded-full px-2 py-0.5 ${showMin ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>Minutes</button>
        <button onClick={() => setShowCorr(v=>!v)} className={`rounded-full px-2 py-0.5 ${showCorr ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>Correct</button>
        <button onClick={() => setShowTasks(v=>!v)} className={`rounded-full px-2 py-0.5 ${showTasks ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-600'}`}>Tasks</button>
      </div>
    </div>
  );
}
