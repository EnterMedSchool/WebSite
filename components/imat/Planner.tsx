"use client";

import { useEffect, useMemo, useState } from "react";

type Props = { totalDays: number };

type PlanMeta = { id: number; userId: number; startDate: string | null; currentDay: number | null };
type DayTask = { id: number; label: string; isCompleted: boolean };
type PlannerLink = { title: string; href: string };
type PlannerVideo = { title: string; href: string; length?: string };
type DayGroup = { day: number; title: string; rest?: boolean; tasks: DayTask[]; videos?: PlannerVideo[]; lessons?: PlannerLink[]; chapters?: PlannerLink[]; done?: number; total?: number };

export default function Planner({ totalDays }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanMeta | null>(null);
  const [daysData, setDaysData] = useState<DayGroup[] | null>(null);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [savingDay, setSavingDay] = useState(false);

  // Fetch or initialize planner (summary first, then lazy-load tasks per day)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const etag = typeof window !== 'undefined' ? localStorage.getItem('imat:sum:etag') || '' : '';
        const r = await fetch("/api/imat/planner/summary", { credentials: "include", headers: etag ? { 'If-None-Match': etag } : undefined });
        if (r.status === 304) {
          const cached = localStorage.getItem('imat:sum:data');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (!cancelled) { setPlan(parsed.plan); setDaysData(parsed.days.map((d:any)=>({ ...d, tasks: [] })) as DayGroup[]); }
            setLoading(false); return;
          }
        }
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load planner summary");
        if (!j?.data?.plan || (Array.isArray(j?.data?.days) && j.data.days.every((d:any)=> (d.total||0) === 0))) {
          const init = await fetch("/api/imat/planner/init", { method: "POST", credentials: "include" });
          const ji = await init.json();
          if (!init.ok) throw new Error(ji?.error || "Failed to initialize planner");
          if (!cancelled) { setPlan(ji.data.plan); setDaysData(ji.data.days); }
        } else {
          const shaped: DayGroup[] = (j.data.days as any[]).map((d:any)=>({ day: d.day, title: d.title, rest: d.rest, tasks: [], videos: d.videos, lessons: d.lessons, chapters: d.chapters, done: d.done, total: d.total }));
          if (!cancelled) { setPlan(j.data.plan); setDaysData(shaped); }
          const newTag = r.headers.get('ETag'); if (newTag) localStorage.setItem('imat:sum:etag', newTag);
          localStorage.setItem('imat:sum:data', JSON.stringify({ plan: j.data.plan, days: shaped }));
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Preferred initial day: where they stopped last time
  const initialDay = useMemo(() => {
    if (!daysData || daysData.length === 0) return 1;
    if (plan?.currentDay && plan.currentDay >= 1 && plan.currentDay <= totalDays) return plan.currentDay;
    const firstIncomplete = daysData.find((d) => d.tasks.some((t) => !t.isCompleted))?.day;
    return firstIncomplete || 1;
  }, [daysData, plan?.currentDay, totalDays]);

  useEffect(() => { if (initialDay) setActiveDay(initialDay); }, [initialDay]);
  // Load tasks lazily when switching day
  useEffect(() => {
    const g = (daysData||[]).find((x)=> x.day === activeDay);
    if (g && (!g.tasks || g.tasks.length === 0)) { ensureDayTasks(activeDay); }
  }, [activeDay]);

  const groups = useMemo(() => {
    const map: Record<number, DayGroup> = {} as any;
    (daysData || []).forEach((d) => { map[d.day] = d; });
    return map;
  }, [daysData]);
  const days = useMemo(() => Object.keys(groups).map((k) => Number(k)).sort((a,b) => a - b), [groups]);

  async function ensureDayTasks(day: number) {
    setDaysData((prev) => prev); // noop to keep type
    try {
      const r = await fetch(`/api/imat/planner/day/${day}`, { credentials: 'include' });
      const j = await r.json(); if (!r.ok) throw new Error(j?.error || 'Failed to load day');
      setDaysData((prev) => prev ? prev.map((dg)=> dg.day===day ? { ...dg, tasks: (j?.data?.items||[]) } : dg) : prev);
    } catch {}
  }

  async function toggleItem(task: DayTask, checked: boolean) {
    try {
      const rect = document.getElementById(`task-${task.id}`)?.getBoundingClientRect();
      const res = await fetch(`/api/imat/planner/task/${task.id}`, { method: "PATCH", credentials: "include", body: JSON.stringify({ isCompleted: checked }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Update failed");
      // Optimistic update
      setDaysData((prev) => {
        if (!prev) return prev;
        return prev.map((dg) => ({ ...dg, tasks: dg.tasks.map((t) => t.id === task.id ? { ...t, isCompleted: checked } : t) }));
      });
      // Auto-advance when finishing the day
      setTimeout(() => {
        setDaysData((cur) => {
          if (!cur) return cur;
          const g = cur.find((d) => d.day === activeDay);
          if (!g) return cur;
          const [done, total] = progressOf(g.tasks);
          if (done === total) {
            // Fireworks celebration for completing a day
            try { launchFireworks(); } catch {}
            const next = Math.min(totalDays, activeDay + 1);
            setActiveDay(next);
            persistCurrentDay(next);
          }
          return cur;
        });
      }, 0);
      const awarded = Number(j?.xpAwarded || 0);
      if (awarded > 0) {
        const pr = j?.progress || null;
        const detail: any = { amount: awarded, from: rect ? { x: rect.left + rect.width / 2, y: rect.top } : undefined };
        if (pr) { detail.newLevel = pr.level; detail.newPct = pr.pct; detail.newInLevel = pr.inLevel; detail.newSpan = pr.span; }
        window.dispatchEvent(new CustomEvent('xp:awarded' as any, { detail }));
      }
    } catch (e: any) {
      setError(e?.message || "Update failed");
    }
  }

  async function persistCurrentDay(day: number) {
    try {
      setSavingDay(true);
      await fetch(`/api/imat/planner/day/${day}`, { method: 'PATCH', credentials: 'include' });
      setPlan((p) => p ? { ...p, currentDay: day } : p);
    } catch {}
    finally { setSavingDay(false); }
  }

    // Overall progress
  const overall = useMemo(() => {
    const days = (daysData || []);
    const hasSummary = days.some((d)=> d.total != null);
    if (hasSummary) {
      const total = days.reduce((a,b)=> a + (b.total||0), 0) || 1;
      const done = days.reduce((a,b)=> a + (b.done||0), 0);
      return { done, total, pct: Math.round((done/total)*100) };
    }
    const all = days.flatMap((d)=> d.tasks||[]);
    const total = all.length || 1;
    const done = all.filter((t)=> t.isCompleted).length;
    return { done, total, pct: Math.round((done/total)*100) };
  }, [daysData]);

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">Loading planner...</div>;
  if (error) return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>;
  if (!daysData || days.length === 0) return <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">Planner is empty.</div>;

  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      {/* Overview */}
      <div className="md:col-span-2 -mt-1">
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-200">
              <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
                <path d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                <path d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32" fill="none" stroke="#6366f1" strokeWidth="4" strokeDasharray={`${overall.pct} ${100-overall.pct}`} />
              </svg>
              <div className="absolute text-xs font-bold text-slate-800">{overall.pct}%</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">Overall Progress</div>
              <div className="text-xs text-slate-600">{overall.done}/{overall.total} tasks completed</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">{savingDay ? 'Saving…' : ''}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="md:col-span-2 -mt-3 mb-1 flex flex-wrap items-center gap-2">
        <a href="/imat-course" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-700">IMAT Course</a>
        <a href="/" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50">Home</a>
      </div>

      {/* Sidebar: day picker */}
      <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-slate-800">Days</div>
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <ul className="space-y-1">
            {days.map((d) => {
              const parent = groups[d];
              let done = 0, total = 0;
              if (parent && parent.total != null) {
                total = Math.max(1, parent.total || 0);
                done = Math.min(total, parent.done || 0);
              } else {
                const dt = progressOf(parent.tasks);
                done = dt[0];
                total = Math.max(1, dt[1]);
              }
              return (
                <li key={d}>
                  <button
                    onClick={() => { setActiveDay(d); ensureDayTasks(d); persistCurrentDay(d); }}
                    className={`w-full items-center rounded-xl border px-2 py-2 text-left text-sm transition ${done === total ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : activeDay === d ? 'border-indigo-200 bg-indigo-50 text-indigo-900' : 'border-transparent hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${done===total ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{d}</span>
                        <span className="truncate">{parent?.title?.replace(/^DAY\s+\d+\s*:?\s*/i, '').slice(0, 42) || `Day ${d}`}</span>
                      </div>
                      <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${done===total ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{Math.round((done/Math.max(1,total))*100)}%</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* Main: tasks of selected day */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {(() => {
          const g = groups[activeDay];
          if (!g) return <div className="text-sm text-slate-600">No tasks for this day.</div>;
          const [done, total] = progressOf(g.tasks);
          return (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Day {activeDay} of {totalDays}</div>
              <h2 className="mb-2 text-xl font-extrabold text-slate-900">{g.title || `Day ${activeDay}`}</h2>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-sky-400" style={{ width: `${Math.round((done/Math.max(1,total))*100)}%` }} />
                </div>
                <div className="text-xs font-semibold text-slate-600">{done}/{total}</div>
              </div>
              <ul className="space-y-2">
                {g.tasks.map((it) => (
                  <TaskRow key={it.id} task={it} onToggle={toggleItem} />
                ))}
              </ul>

              {(g.videos?.length || g.lessons?.length || g.chapters?.length) ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <ResourceCard title="Recommended Videos" items={(g.videos||[]).map(v=>({ title: v.length ? `${v.title} · ${v.length}` : v.title, href: v.href }))} />
                  <ResourceCard title="Related Lessons" items={[...(g.lessons||[]), ...(g.chapters||[])]} />
                </div>
              ) : null}
            </div>
          );
        })()}
      </section>
    </div>
  );
}

function progressOf(children: DayTask[]): [number, number] {
  const total = children.length || 1;
  const done = children.filter((c) => c.isCompleted).length;
  return [done, total];
}

// Single task row with pending spinner for crisp feedback
function TaskRow({ task, onToggle }: { task: DayTask; onToggle: (t: DayTask, checked: boolean) => void }) {
  const [pending, setPending] = useState(false);
  const handle = async (checked: boolean) => { if (pending) return; setPending(true); try { await onToggle(task, checked); } finally { setPending(false); } };
  return (
    <li id={`task-${task.id}`} className={`group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md ${pending ? 'opacity-70' : ''}`}>
      {pending ? (
        <span className="mt-1 inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" aria-label="loading" />
      ) : (
        <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={!!task.isCompleted} onChange={(e)=>handle(e.target.checked)} />
      )}
      <div className={`text-sm leading-relaxed ${task.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{task.label}</div>
    </li>
  );
}

function ResourceCard({ title, items }: { title: string; items: { title: string; href: string }[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-slate-900">{title}</div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i}>
            <a className="group inline-flex max-w-full items-center gap-2 truncate rounded-lg px-2 py-1 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-800" href={it.href} target="_self" rel="nofollow">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400 group-hover:bg-indigo-600" />
              <span className="truncate">{it.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Lightweight fireworks animation
function launchFireworks() {
  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.inset = '0';
  root.style.pointerEvents = 'none';
  root.style.zIndex = '9999';
  document.body.appendChild(root);
  const center = { x: window.innerWidth / 2, y: window.innerHeight / 3 };
  const colors = ['#22c55e', '#60a5fa', '#f59e0b', '#ef4444', '#8b5cf6'];
  const N = 28;
  for (let i = 0; i < N; i++) {
    const p = document.createElement('span');
    p.style.position = 'fixed';
    p.style.left = `${center.x}px`;
    p.style.top = `${center.y}px`;
    p.style.width = '6px'; p.style.height = '6px';
    p.style.borderRadius = '9999px';
    p.style.background = colors[i % colors.length];
    p.style.boxShadow = '0 0 12px rgba(0,0,0,.15)';
    root.appendChild(p);
    const angle = (i / N) * Math.PI * 2;
    const dist = 80 + Math.random() * 80;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    (p as any).animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(${dx - 3}px, ${dy - 3}px) scale(0.6)`, opacity: 0 }
    ], { duration: 900 + Math.random()*300, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => p.remove();
  }
  setTimeout(() => root.remove(), 1200);
}
