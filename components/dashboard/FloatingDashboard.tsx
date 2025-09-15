"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";

export default function FloatingDashboard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'overview'|'learning'|'class'|'settings'>('overview');
  const [name] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) {
      document.addEventListener("keydown", onKey);
      // Prevent background scroll when overlay is open (mobile friendly)
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prev;
      };
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const firstName = useMemo(() => {
    const n = name || "there"; return (n.split(" ")[0] || "there").trim();
  }, [name]);

  // Determine viewport first; defer early return until after hooks

  // Shared menu items used by both the side rail (desktop) and mobile nav
  const MENU = [
    { key: 'overview' as const, label: 'Overview', icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
    )},
    { key: 'learning' as const, label: 'Learning', icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M12 3l9 4.5-9 4.5L3 7.5 12 3zm0 6.75L20.25 6V18l-8.25 3.75V9.75zM3.75 18V6L12 9.75V21L3.75 18z"/></svg>
    )},
    { key: 'class' as const, label: 'Class', icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z"/></svg>
    )},
    { key: 'settings' as const, label: 'Settings', icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M12 8a4 4 0 1 1-4 4 4 4 0 0 1 4-4m0-6 2.1 3.5 4-.5-.9 3.9 3.3 2.3-3.3 2.3.9 3.9-4-.5L12 22l-2.1-3.5-4 .5.9-3.9L3.5 13l3.3-2.3-.9-3.9 4 .5L12 2Z"/></svg>
    )},
  ];

  // Detect mobile viewport to render a dedicated iOS-style drawer
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(max-width: 639px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile('matches' in e ? e.matches : (e as MediaQueryList).matches);
    handler(mql);
    mql.addEventListener?.('change', handler as any);
    return () => mql.removeEventListener?.('change', handler as any);
  }, []);

  if (isMobile) {
    return (
      <MobileDashboardDrawer open={open} onClose={onClose} tab={tab} setTab={setTab} MENU={MENU} firstName={firstName} />
    );
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center overflow-y-auto bg-gradient-to-br from-black/60 via-indigo-900/20 to-fuchsia-900/20 backdrop-blur-[2px] p-3 sm:p-4" onClick={onClose}>
      <div className="relative w-full max-w-7xl my-2 sm:my-4 rounded-2xl sm:rounded-[28px] border border-violet-200/60 bg-white shadow-[0_30px_90px_rgba(99,102,241,0.35)] ring-1 ring-white/40 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
        {/* Left rail */}
        <div className="absolute left-0 top-0 hidden h-full sm:block sm:w-56 rounded-l-2xl sm:rounded-l-[28px] bg-gradient-to-b from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-[inset_-1px_0_0_rgba(255,255,255,0.3)]">
          <div className="flex h-full flex-col justify-between py-5">
            <div className="px-3">
              <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-white/80">Menu</div>
              {MENU.map((m) => (
                <button key={m.key as string} onClick={() => setTab(m.key as any)} className={`group mb-1 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-semibold ${tab===m.key ? 'bg-white/15 text-white shadow-inner' : 'text-white/85 hover:bg-white/10 hover:text-white'}`}>
                  <span className={`grid h-7 w-7 place-items-center rounded-lg bg-white/15 text-white shadow-sm ring-1 ring-white/20`}>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
            <div className="px-3">
              <div className="rounded-2xl bg-white/10 p-3 text-[11px]">
                <div className="font-semibold">Hi, {firstName}!</div>
                <div className="mt-1 text-white/80">Track your learning here. Explore your tasks, goals and insights. UI preview only.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile bottom nav (floating) */}
        <div className="pointer-events-auto fixed inset-x-0 bottom-3 z-[9999] mx-auto w-[min(100%-1.5rem,36rem)] sm:hidden">
          <div className="rounded-2xl border border-gray-200 bg-white/90 p-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/70">
            <div className="grid grid-cols-4 gap-1">
              {MENU.map(m => (
                <button key={m.key}
                        onClick={() => setTab(m.key)}
                        className={`flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-[12px] font-semibold ${tab===m.key ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <span className={`grid h-5 w-5 place-items-center ${tab===m.key ? 'text-white' : 'text-indigo-700'}`}>{m.icon}</span>
                  <span className="truncate">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="ml-0 sm:ml-56 grid min-h-[70vh] grid-cols-1 gap-3 sm:gap-4 rounded-2xl sm:rounded-r-[28px] p-4 sm:p-5 pb-24 sm:pb-6">
          {/* Mobile top nav */}
          <div className="col-span-full sm:hidden">
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-indigo-100/70 to-fuchsia-50 p-1 ring-1 ring-white/60">
              <div className="grid grid-cols-4 gap-1">
                {MENU.map(m => (
                  <button key={m.key}
                          onClick={() => setTab(m.key)}
                          className={`flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-[12px] font-semibold ${tab===m.key ? 'bg-white text-indigo-700 ring-1 ring-indigo-200' : 'text-indigo-800/80 hover:bg-white/60'}`}>
                    <span className="grid h-5 w-5 place-items-center text-indigo-700">{m.icon}</span>
                    <span className="truncate">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Header row */}
          <div className="col-span-full flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-indigo-200/60 bg-gradient-to-r from-indigo-50 via-indigo-100 to-fuchsia-50 p-3 sm:p-4 ring-1 ring-white/60">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow"><svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M12 2 15 8l6 1-5 4 2 7-6-3-6 3 2-7-5-4 6-1 3-6Z"/></svg></span>
              <div>
                <div className="text-sm font-semibold text-indigo-800">Welcome back{firstName ? `, ${firstName}` : ''}</div>
                <div className="text-[12px] text-indigo-700/80">Daily overview of your learning journey (UI preview).</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="/course-mates" className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50">Course Hub</a>
              <button onClick={onClose} className="rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-indigo-700" aria-label="Close">Close</button>
            </div>
          </div>

          {tab === 'overview' && (
            <>
              {/* Stats pills */}
              <div className="space-y-2 md:col-span-2">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                  <StatPill color="emerald" label="Correct today" value={`—`} />
                  <StatPill color="sky" label="Streak" value={`—`} />
                </div>
                <div className="rounded-2xl border bg-white p-3 ring-1 ring-gray-100">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">Last 7 days</div>
                    <div className="text-[11px] text-gray-500">XP • Minutes • Correct • Tasks</div>
                  </div>
                  <MiniChartSkeleton />
                </div>
              </div>

              {/* Right column: Profile + counts */}
              <div className="space-y-3">
                <ProfileCardSkeleton />
                <div className="grid grid-cols-2 gap-2">
                  <SmallStatCard title="Classmates" value="—" note="Your Course — Year —" />
                  <SmallStatCard title="Active now" value="—" note="Course Hub" />
                </div>
              </div>

              {/* Continue learning */}
              <div className="md:col-span-2">
                <div className="rounded-2xl border bg-white p-4 ring-1 ring-gray-100">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">Continue learning</div>
                    <a className="text-[11px] font-semibold text-indigo-700 hover:underline" href="#">See all</a>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[0,1].map((i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border bg-indigo-50/40 p-3 ring-1 ring-indigo-200/60">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-indigo-900">Chapter title</div>
                          <div className="text-[11px] text-indigo-800/80">Course</div>
                        </div>
                        <button className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">Continue</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommended + Quick actions */}
              <div className="space-y-3">
                <div className="rounded-2xl border bg-white p-4 ring-1 ring-gray-100">
                  <div className="mb-1 text-sm font-semibold text-gray-900">Recommended for you</div>
                  <ul className="space-y-1">
                    {[1,2,3,4].map((i)=>(
                      <li key={i} className="flex items-center justify-between rounded-lg px-2 py-1">
                        <div className="min-w-0 truncate text-[13px] text-gray-800">Course {i}</div>
                        <button className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">Open</button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border bg-white p-4 ring-1 ring-gray-100">
                  <div className="mb-1 text-sm font-semibold text-gray-900">Quick actions</div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <button className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-700 ring-1 ring-indigo-200">Start lesson</button>
                    <button className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-200">Practice quiz</button>
                    <button className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700 ring-1 ring-amber-200">Review cards</button>
                    <button className="rounded-full bg-fuchsia-50 px-3 py-1 font-semibold text-fuchsia-700 ring-1 ring-fuchsia-200">Plan study</button>
                  </div>
                </div>
              </div>

              {/* Privacy & Settings preview */}
              <div className="col-span-full rounded-2xl border bg-white p-4 ring-1 ring-gray-100">
                <div className="text-sm font-semibold text-gray-900">Privacy & Settings</div>
                <div className="mt-2 grid gap-3 md:grid-cols-3">
                  <ToggleCard title="Public Profile" desc="Control how your profile appears on Course Mates." />
                  <ToggleCard title="Notifications" desc="Stay up to date with learning reminders." />
                  <ThemeCard />
                </div>
              </div>
            </>
          )}

          {tab === 'learning' && (
            <div className="col-span-full grid gap-4 sm:grid-cols-2">
              <SectionCard title="Upcoming lessons">
                <ul className="space-y-2 text-sm">
                  {[1,2,3].map(i => (
                    <li key={i} className="flex items-center justify-between rounded-xl border px-3 py-2">
                      <div>
                        <div className="font-semibold text-gray-900">Lesson {i}</div>
                        <div className="text-[11px] text-gray-600">Chapter · 30 min</div>
                      </div>
                      <button className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">Preview</button>
                    </li>
                  ))}
                </ul>
              </SectionCard>
              <SectionCard title="Achievements preview">
                <div className="grid grid-cols-3 gap-2">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="grid h-16 place-items-center rounded-xl border bg-white text-[11px] text-gray-600">Badge</div>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

          {tab === 'class' && (
            <div className="col-span-full space-y-4">
              <div className="overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow ring-1 ring-white/30">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/80">Course Hub</div>
                    <h2 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">Your Course</h2>
                    <div className="mt-1 text-sm text-indigo-100">Year —</div>
                  </div>
                  <div className="hidden w-full flex-wrap items-center gap-2 sm:flex sm:w-auto">
                    <a href="#feed" className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/30">Post update</a>
                    <a href="#events" className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/30">Create event</a>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/90">
                  {['Overview','Feed','Leaderboard','Photos','Events','Orgs'].map((t,i)=> (
                    <a key={i} href={`#${t.toLowerCase()}`} className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/15">{t}</a>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div id="overview" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-lg font-semibold">Highlights</div>
                  <a href="#feed" className="text-xs font-semibold text-indigo-700 hover:underline">See feed</a>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <SmallStatCard title="Active now" value="—" note="classmates online" />
                  <SmallStatCard title="Study vibe" value="—" note="set by moderators" />
                  <SmallStatCard title="Members" value="—" note="verified classmates" />
                  <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Course Activity</div>
                      <span className="text-[10px] text-indigo-700/80">Last 7 days</span>
                    </div>
                    <div className="mt-2 h-8 w-full rounded bg-white/60" />
                  </div>
                </div>
              </div>

              {/* Leaderboard skeleton */}
              <div id="leaderboard" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-lg font-semibold">Leaderboard</div>
                  <div className="text-[11px] text-gray-500">Top performers in your course</div>
                </div>
                <div className="text-xs font-semibold text-gray-600">This Week</div>
                <ul className="mt-1 space-y-1">
                  {[1,2,3,4,5].map((i)=> (
                    <li key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ring-1 ${i<=3 ? 'bg-gradient-to-r from-indigo-50 to-fuchsia-50 ring-indigo-200' : 'bg-white ring-gray-200'}`}>
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`grid h-7 w-7 place-items-center rounded-full ${i<=3 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'} text-[11px] font-bold`}>#{i}</span>
                        <span className="truncate font-medium text-gray-800">Student {i}</span>
                      </div>
                      <span className={`${i<=3 ? 'text-indigo-700' : 'text-gray-700'} text-xs`}>— XP</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Events + Photos */}
              <div className="grid gap-4 sm:grid-cols-2">
                <SectionCard title="Upcoming Events">
                  <ul className="space-y-2 text-sm text-gray-700">
                    {[1,2,3].map(i => (
                      <li key={i} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded bg-gray-100" />
                          <div>
                            <div className="font-semibold">Event {i}</div>
                            <div className="text-xs text-gray-600">Soon · Location</div>
                          </div>
                        </div>
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">Remind me</span>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
                <SectionCard title="Photos from Events">
                  <div className="grid grid-cols-3 gap-2">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="aspect-[4/3] w-full rounded-lg bg-gray-100" />
                    ))}
                  </div>
                </SectionCard>
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div className="col-span-full grid gap-4 sm:grid-cols-2">
              <ToggleCard title="Public Profile" desc="Control how your profile appears across the site." />
              <ToggleCard title="Email Notifications" desc="Learning summaries and reminders." />
              <ThemeCard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({ color, label, value }: { color: 'indigo'|'emerald'|'amber'|'sky'; label: string; value: string }) {
  const theme = color === 'indigo'
    ? { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200' }
    : color === 'emerald'
    ? { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' }
    : color === 'amber'
    ? { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' }
    : { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200' };
  return (
    <div className={`min-w-0 flex items-center justify-between overflow-hidden rounded-2xl border ${theme.ring} ${theme.bg} px-3 py-2`}>
      <div className={`min-w-0 truncate text-[12px] font-semibold ${theme.text}`}>{label}</div>
      <div className={`shrink-0 text-[11px] font-extrabold tabular-nums ${theme.text}`}>{value}</div>
    </div>
  );
}

function MiniChartSkeleton() {
  return <div className="h-28 w-full animate-pulse rounded-xl bg-gray-100" />;
}

function ProfileCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white/90 shadow-[0_10px_30px_rgba(99,102,241,0.10)]">
      <div className="relative h-28 w-full bg-gradient-to-r from-indigo-200 via-violet-200 to-fuchsia-200" />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-indigo-100"><span className="text-base font-semibold text-indigo-700">U</span></span>
          <div>
            <div className="font-semibold text-gray-900">Your Name</div>
            <a href="#" className="text-xs font-semibold text-indigo-700 underline">Edit profile</a>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded-xl border p-2"><div className="text-lg font-extrabold text-gray-900">—</div><div className="text-gray-600">Level</div></div>
          <div className="rounded-xl border p-2"><div className="text-lg font-extrabold text-gray-900">—</div><div className="text-gray-600">XP</div></div>
          <div className="rounded-xl border p-2"><div className="text-lg font-extrabold text-gray-900">—</div><div className="text-gray-600">Streak</div></div>
          <div className="rounded-xl border p-2"><div className="text-lg font-extrabold text-gray-900">—</div><div className="text-gray-600">Items</div></div>
        </div>
      </div>
    </div>
  );
}

function SmallStatCard({ title, value, note }: { title: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white/90 p-3 shadow-[0_10px_30px_rgba(79,70,229,0.10)]">
      <div className="text-xs font-semibold text-gray-600">{title}</div>
      <div className="mt-1 text-2xl font-extrabold text-indigo-700">{value}</div>
      <div className="text-[11px] text-gray-600">{note}</div>
    </div>
  );
}

function ToggleCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border bg-gray-50 p-3">
      <div className="text-[12px] font-semibold text-gray-800">{title}</div>
      <div className="mt-1 text-[11px] text-gray-600">{desc}</div>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-[11px] text-gray-700">Off</div>
        <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300"><span className="inline-block h-4 w-4 translate-x-1 transform rounded-full bg-white" /></button>
      </div>
    </div>
  );
}

function ThemeCard() {
  return (
    <div className="rounded-xl border bg-gray-50 p-3">
      <div className="text-[12px] font-semibold text-gray-800">Theme</div>
      <div className="mt-1 text-[11px] text-gray-600">Customize your dashboard appearance.</div>
      <div className="mt-2 flex items-center gap-2 text-[11px]">
        <button className="rounded-md bg-white px-2 py-1 ring-1 ring-gray-200">Light</button>
        <button className="rounded-md bg-gray-900 px-2 py-1 text-white ring-1 ring-gray-800">Dark</button>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-4 ring-1 ring-gray-100">
      <div className="mb-2 text-sm font-semibold text-gray-900">{title}</div>
      {children}
    </div>
  );
}

function InsightCard({ title, items, accent }: { title: string; items: string[]; accent?: 'rose'|'emerald' }) {
  const text = accent === 'rose' ? 'text-rose-700' : accent === 'emerald' ? 'text-emerald-700' : 'text-indigo-700';
  const ring = accent === 'rose' ? 'ring-rose-200' : accent === 'emerald' ? 'ring-emerald-200' : 'ring-indigo-200';
  const bg = accent === 'rose' ? 'bg-rose-50' : accent === 'emerald' ? 'bg-emerald-50' : 'bg-indigo-50';
  return (
    <div className={`rounded-2xl border ${ring} ${bg} p-4`}>
      <div className={`text-sm font-semibold ${text}`}>{title}</div>
      <ul className="mt-2 space-y-1 text-[13px] text-gray-800">
        {items.map((it, i)=>(<li key={i} className="rounded-lg bg-white/60 px-2 py-1">{it}</li>))}
      </ul>
    </div>
  );
}

// --- Mobile-only bottom drawer layout ---
function MobileDashboardDrawer({
  open,
  onClose,
  tab,
  setTab,
  MENU,
  firstName,
}: {
  open: boolean;
  onClose: () => void;
  tab: 'overview'|'learning'|'class'|'settings';
  setTab: (t: 'overview'|'learning'|'class'|'settings') => void;
  MENU: readonly { key: 'overview'|'learning'|'class'|'settings'; label: string; icon: JSX.Element }[];
  firstName: string;
}) {
  const [vh, setVh] = useState(0);
  const [snap, setSnap] = useState<'peek'|'half'|'full'>('half');
  const y = useMotionValue(0);

  useEffect(() => {
    const set = () => setVh(window.innerHeight);
    set();
    window.addEventListener('resize', set);
    return () => window.removeEventListener('resize', set);
  }, []);

  const snapTop = (s: 'peek'|'half'|'full') => {
    // Values are the top offset in px (how far from the top the sheet's top is)
    const ratios: Record<typeof s, number> = { full: 0.08, half: 0.45, peek: 0.72 } as any;
    return Math.round(vh * ratios[s]);
  };

  useEffect(() => {
    y.set(snapTop(snap));
  }, [vh, snap]);

  const currentLabel = MENU.find(m => m.key === tab)?.label ?? 'Overview';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] sm:hidden">
      {/* Blue app background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-700 to-blue-600" />

      {/* Header over blue background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-end justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] text-white">
        <div className="pointer-events-auto inline-flex items-center gap-2">
          <button aria-label="Close" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 ring-1 ring-white/25">
            <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M18.3 5.71 12 12l6.3 6.29-1.42 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.17 12 2.89 5.71 4.3 4.29 10.59 10.6l6.29-6.3z"/></svg>
          </button>
          <div className="text-xl font-extrabold tracking-tight">{currentLabel}</div>
        </div>
        <div className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-white/15 ring-1 ring-white/25">
          <span className="text-[11px] font-bold uppercase">{firstName?.[0] ?? 'U'}</span>
        </div>
      </div>

      {/* Section name big watermark */}
      <div className="absolute left-4 right-4 top-16 select-none text-4xl font-black leading-none tracking-tight text-white/15">
        {currentLabel}
      </div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        <motion.div
          className="fixed inset-x-0 bottom-0 z-[9999] rounded-t-[28px] bg-white shadow-[0_-20px_80px_rgba(0,0,0,0.25)] ring-1 ring-black/5"
          style={{ y }}
          drag="y"
          dragElastic={0.05}
          dragConstraints={{ top: Math.max(-vh, -1000), bottom: vh }}
          onDragEnd={(_, info) => {
            const endY = y.get() + info.offset.y;
            const points = [
              { k: 'full' as const, y: snapTop('full') },
              { k: 'half' as const, y: snapTop('half') },
              { k: 'peek' as const, y: snapTop('peek') },
            ];
            const target = points.reduce((a, b) => Math.abs(b.y - endY) < Math.abs(a.y - endY) ? b : a, points[0]);
            setSnap(target.k);
          }}
          initial={false}
        >
          {/* Grabber */}
          <div className="sticky top-0 z-10 grid place-items-center rounded-t-[28px] bg-white/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-white/75">
            <div className="h-1.5 w-10 rounded-full bg-gray-300" />
          </div>

          {/* Sheet Content */}
          <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+64px)]">
            {/* Quick header inside sheet */}
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Welcome{firstName?`, ${firstName}`:''}</div>
              <a href="/course-mates" className="rounded-full bg-gray-100 px-3 py-1 text-[12px] font-semibold text-gray-800">Hub</a>
            </div>

            {/* Tabs content skeletons */}
            {tab === 'overview' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <StatPill color="emerald" label="Correct today" value={`—`} />
                  <StatPill color="sky" label="Streak" value={`—`} />
                </div>
                <ProfileCardSkeleton />
                <SectionCard title="Continue learning">
                  <div className="space-y-2">
                    {[0,1].map(i => (
                      <div key={i} className="flex items-center justify-between rounded-xl border bg-indigo-50/40 p-3 ring-1 ring-indigo-200/60">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-indigo-900">Chapter title</div>
                          <div className="text-[11px] text-indigo-800/80">Course</div>
                        </div>
                        <button className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">Continue</button>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {tab === 'learning' && (
              <div className="space-y-3">
                <SectionCard title="Upcoming lessons">
                  <ul className="space-y-2 text-sm">
                    {[1,2,3].map(i => (
                      <li key={i} className="flex items-center justify-between rounded-xl border px-3 py-2">
                        <div>
                          <div className="font-semibold text-gray-900">Lesson {i}</div>
                          <div className="text-[11px] text-gray-600">Chapter · 30 min</div>
                        </div>
                        <button className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-200">Preview</button>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
                <SectionCard title="Achievements preview">
                  <div className="grid grid-cols-3 gap-2">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="grid h-16 place-items-center rounded-xl border bg-white text-[11px] text-gray-600">Badge</div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}

            {tab === 'class' && (
              <div className="space-y-3">
                <SectionCard title="Highlights">
                  <div className="grid grid-cols-3 gap-2">
                    <SmallStatCard title="Active now" value="—" note="online" />
                    <SmallStatCard title="Members" value="—" note="verified" />
                    <SmallStatCard title="Vibe" value="—" note="course mood" />
                  </div>
                </SectionCard>
                <SectionCard title="Events">
                  <div className="space-y-2">
                    {[1,2].map(i => (<div key={i} className="h-12 rounded-xl border bg-gray-50" />))}
                  </div>
                </SectionCard>
              </div>
            )}

            {tab === 'settings' && (
              <div className="grid gap-3">
                <ToggleCard title="Public Profile" desc="Control profile visibility" />
                <ToggleCard title="Notifications" desc="Reminders and summaries" />
                <ThemeCard />
              </div>
            )}
          </div>

          {/* Bottom nav inside the sheet */}
          <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-[10000] mx-auto w-full px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <div className="grid grid-cols-5 gap-2 rounded-2xl bg-gray-100 p-1 ring-1 ring-gray-200">
              {MENU.map(m => (
                <button key={m.key}
                        onClick={() => setTab(m.key)}
                        className={`flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-[12px] font-semibold transition ${tab===m.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-700 hover:bg-white'}`}>
                  <span className={`grid h-5 w-5 place-items-center ${tab===m.key ? 'text-indigo-700' : 'text-gray-700'}`}>{m.icon}</span>
                  <span className="truncate">{m.label}</span>
                </button>
              ))}
              <button className="ml-auto grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-md">
                <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M11 11V4h2v7h7v2h-7v7h-2v-7H4v-2z"/></svg>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
