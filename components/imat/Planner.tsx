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

  // Compute today index from start date
  const todayIndex = useMemo(() => {
    if (!plan?.startDate) return 1;
    const start = new Date(plan.startDate);
    const now = new Date();
    const diffMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const day = Math.min(totalDays, Math.max(1, diffDays + 1));
    return day;
  }, [plan?.startDate, totalDays]);

  useEffect(() => { setActiveDay(todayIndex); }, [todayIndex]);

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

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">Loading planner…</div>;
  if (error) return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>;
  if (!daysData || days.length === 0) return <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">Planner is empty.</div>;

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      {/* Sidebar: day picker */}
      <aside className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-800">Days</div>
          <button
            className="rounded-lg border px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
            onClick={() => setActiveDay(todayIndex)}
            title="Jump to today"
          >Today</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <ul className="space-y-1">
            {days.map((d) => {
              const parent = groups[d];
              const [done, total] = progressOf(parent.tasks);
              return (
                <li key={d}>
                  <button
                    onClick={() => setActiveDay(d)}
                    className={`w-full rounded-lg px-2 py-1.5 text-left text-sm ${activeDay === d ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'} transition`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{parent?.title?.slice(0, 42) || `Day ${d}`}</span>
                      <span className="ml-2 text-xs text-slate-500">{Math.round((done/Math.max(1,total))*100)}%</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* Main: tasks of selected day */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {(() => {
          const g = groups[activeDay];
          if (!g) return <div className="text-sm text-slate-600">No tasks for this day.</div>;
          const [done, total] = progressOf(g.tasks);
          return (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Day {activeDay} of {totalDays}</div>
              <h2 className="mb-3 text-lg font-bold text-slate-900">{g.title || `Day ${activeDay}`}</h2>
              <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-sky-400" style={{ width: `${Math.round((done/Math.max(1,total))*100)}%` }} />
              </div>
              <ul className="space-y-2">
                {g.tasks.map((it) => (
                  <li key={it.id} id={`task-${it.id}`} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={!!it.isCompleted}
                      onChange={(e) => toggleItem(it, e.target.checked)}
                    />
                    <div className={`text-sm ${it.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{it.label}</div>
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
