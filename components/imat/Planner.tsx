"use client";

import { useEffect, useMemo, useState } from "react";

type Props = { totalDays: number };

type PlanMeta = { id: number; userId: number; startDate: string | null; currentDay: number | null };
type DayTask = { id: number; label: string; isCompleted: boolean };
type DayGroup = { day: number; title: string; rest?: boolean; tasks: DayTask[] };

export default function Planner({ totalDays }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanMeta | null>(null);
  const [daysData, setDaysData] = useState<DayGroup[] | null>(null);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [savingDay, setSavingDay] = useState(false);

  // Fetch or initialize planner
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch("/api/imat/planner", { credentials: "include" });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Failed to load planner");
        if (!j?.data) {
          const init = await fetch("/api/imat/planner/init", { method: "POST", credentials: "include" });
          const ji = await init.json();
          if (!init.ok) throw new Error(ji?.error || "Failed to initialize planner");
          if (!cancelled) { setPlan(ji.data.plan); setDaysData(ji.data.days); }
        } else {
          if (!cancelled) { setPlan(j.data.plan); setDaysData(j.data.days); }
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

  const groups = useMemo(() => {
    const map: Record<number, DayGroup> = {} as any;
    (daysData || []).forEach((d) => { map[d.day] = d; });
    return map;
  }, [daysData]);
  const days = useMemo(() => Object.keys(groups).map((k) => Number(k)).sort((a,b) => a - b), [groups]);

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
    const all = (daysData || []).flatMap((d) => d.tasks);
    const total = all.length || 1;
    const done = all.filter((t) => t.isCompleted).length;
    const pct = Math.round((done / total) * 100);
    return { done, total, pct };
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

      {/* Sidebar: day picker */}
      <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 text-sm font-semibold text-slate-800">Days</div>
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <ul className="space-y-1">
            {days.map((d) => {
              const parent = groups[d];
              const [done, total] = progressOf(parent.tasks);
              return (
                <li key={d}>
                  <button
                    onClick={() => { setActiveDay(d); persistCurrentDay(d); }}
                    className={`w-full items-center rounded-xl border px-2 py-2 text-left text-sm transition ${activeDay === d ? 'border-indigo-200 bg-indigo-50 text-indigo-900 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">{d}</span>
                        <span className="truncate">{parent?.title?.replace(/^DAY\s+\d+\s*:?\s*/i, '').slice(0, 42) || `Day ${d}`}</span>
                      </div>
                      <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{Math.round((done/Math.max(1,total))*100)}%</span>
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
                  <li key={it.id} id={`task-${it.id}`} className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={!!it.isCompleted}
                      onChange={(e) => toggleItem(it, e.target.checked)}
                    />
                    <div className={`text-sm leading-relaxed ${it.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{it.label}</div>
                  </li>
                ))}
              </ul>
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
