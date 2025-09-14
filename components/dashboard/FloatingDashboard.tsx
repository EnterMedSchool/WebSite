"use client";

import { useEffect, useMemo, useState } from "react";

export default function FloatingDashboard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<'overview'|'learning'|'tasks'|'goals'|'insights'|'settings'>('overview');
  const [name] = useState<string | null>(null);
  const [tasks, setTasks] = useState<{ id: number; label: string; done: boolean }[]>([
    { id: 1, label: 'Watch a lesson', done: false },
    { id: 2, label: 'Answer 10 questions', done: false },
    { id: 3, label: 'Review flashcards', done: false },
  ]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const firstName = useMemo(() => {
    const n = name || "there"; return (n.split(" ")[0] || "there").trim();
  }, [name]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center overflow-y-auto bg-gradient-to-br from-black/40 via-indigo-900/10 to-fuchsia-900/10 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div className="relative w-full max-w-7xl my-4 rounded-[28px] border border-violet-200/60 bg-white/90 shadow-[0_30px_90px_rgba(99,102,241,0.35)] ring-1 ring-white/40 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
        {/* Left rail */}
        <div className="absolute left-0 top-0 h-full w-56 rounded-l-[28px] bg-gradient-to-b from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-[inset_-1px_0_0_rgba(255,255,255,0.3)]">
          <div className="flex h-full flex-col justify-between py-5">
            <div className="px-3">
              <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-white/80">Menu</div>
              {([
                { key: 'overview', label: 'Overview', icon: (
                  <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
                )},
                { key: 'learning', label: 'Learning', icon: (
                  <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M12 3l9 4.5-9 4.5L3 7.5 12 3zm0 6.75L20.25 6V18l-8.25 3.75V9.75zM3.75 18V6L12 9.75V21L3.75 18z"/></svg>
                )},
                { key: 'tasks', label: 'Tasks', icon: (
                  <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4Z"/></svg>
                )},
                { key: 'goals', label: 'Goals', icon: (
                  <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M12 2 20 7l-8 5-8-5 8-5Zm0 7 8 5-8 5-8-5 8-5Z"/></svg>
                )},
                { key: 'insights', label: 'Insights', icon: (
                  <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M3 13h6v8H3v-8m12-4h6v12h-6V9M9 3h6v18H9V3Z"/></svg>
                )},
                { key: 'settings', label: 'Settings', icon: (
                  <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M12 8a4 4 0 1 1-4 4 4 4 0 0 1 4-4m0-6 2.1 3.5 4-.5-.9 3.9 3.3 2.3-3.3 2.3.9 3.9-4-.5L12 22l-2.1-3.5-4 .5.9-3.9L3.5 13l3.3-2.3-.9-3.9 4 .5L12 2Z"/></svg>
                )},
              ] as const).map((m) => (
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

        {/* Main content */}
        <div className="ml-56 grid min-h-[70vh] grid-cols-1 gap-4 rounded-r-[28px] p-5 sm:grid-cols-3">
          {/* Header row */}
          <div className="col-span-full flex items-center justify-between rounded-3xl border border-indigo-200/60 bg-gradient-to-r from-indigo-50 via-indigo-100 to-fuchsia-50 p-4 ring-1 ring-white/60">
            <div className="flex items-center gap-3">
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
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <StatPill color="indigo" label="Minutes today" value={`—`} />
                  <StatPill color="emerald" label="Correct today" value={`—`} />
                  <StatPill color="amber" label="Tasks today" value={`—`} />
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

          {tab === 'tasks' && (
            <div className="col-span-full grid gap-4 sm:grid-cols-2">
              <SectionCard title="Today’s tasks">
                <ul className="space-y-2 text-sm">
                  {tasks.map(t => (
                    <li key={t.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
                      <label className="flex items-center gap-2 text-gray-800">
                        <input type="checkbox" checked={t.done} onChange={()=> setTasks(ts => ts.map(x => x.id===t.id ? { ...x, done: !x.done } : x))} />
                        <span className={t.done ? 'line-through text-gray-500' : ''}>{t.label}</span>
                      </label>
                      <span className="text-[11px] text-gray-500">+10m</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
              <SectionCard title="Focus timer">
                <div className="grid place-items-center rounded-2xl bg-gray-50 p-6">
                  <div className="text-4xl font-extrabold text-gray-800">25:00</div>
                  <div className="mt-2 flex gap-2">
                    <button className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white">Start</button>
                    <button className="rounded-full bg-gray-200 px-4 py-1.5 text-sm font-semibold text-gray-700">Reset</button>
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {tab === 'goals' && (
            <div className="col-span-full grid gap-4 sm:grid-cols-2">
              <SectionCard title="Study goals">
                <div className="space-y-2 text-sm">
                  {[['Daily minutes','30'], ['Weekly lessons','4'], ['Correct answers','100']].map(([k,v],i)=>(
                    <div key={i} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2">
                      <div className="font-semibold text-gray-900">{k}</div>
                      <div className="text-[11px] text-gray-600">Target: {v}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="Motivation">
                <div className="rounded-xl bg-gradient-to-br from-amber-100 via-rose-50 to-fuchsia-100 p-4 text-sm text-amber-900 ring-1 ring-amber-200/60">Small steps build strong habits. Keep going!</div>
              </SectionCard>
            </div>
          )}

          {tab === 'insights' && (
            <div className="col-span-full grid gap-4 sm:grid-cols-3">
              <InsightCard title="Strongest topics" items={["Hematology", "Biochemistry", "Physiology"]} />
              <InsightCard title="Needs attention" items={["Anatomy", "Pathology"]} accent="rose" />
              <InsightCard title="Best study time" items={["Evenings", "Weekends"]} accent="emerald" />
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

