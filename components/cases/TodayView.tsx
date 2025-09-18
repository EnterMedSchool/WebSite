"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePractice } from "./PracticeProvider";

function radialStyle(pct: number) {
  const clamped = Math.max(0, Math.min(100, pct));
  return {
    background: `conic-gradient(#6366f1 ${clamped}% , rgba(79,70,229,0.2) ${clamped}% 100%)`,
  } as const;
}

const paceCopy: Record<string, { label: string; tone: string; glow: string }> = {
  ahead: { label: "Ahead of pace", tone: "text-emerald-200", glow: "shadow-[0_0_20px_rgba(16,185,129,0.35)]" },
  on_target: { label: "On target", tone: "text-sky-200", glow: "shadow-[0_0_20px_rgba(56,189,248,0.35)]" },
  behind: { label: "Catch up focus", tone: "text-amber-200", glow: "shadow-[0_0_20px_rgba(251,191,36,0.3)]" },
};

export default function TodayView() {
  const { bundle, state, setPlanStatus, setMode } = usePractice();
  const baseHref = `/cases/${bundle.collection.slug}`;
  const planMinutes = useMemo(() => {
    const completed = Object.entries(state.todayPlanStatus).reduce((acc, [id, status]) => {
      if (status === "completed") {
        const item = bundle.todayPlan.flatMap((block) => block.items).find((current) => current.id === id);
        return acc + (item?.durationMinutes || 0);
      }
      return acc;
    }, 0);
    return completed;
  }, [state.todayPlanStatus, bundle.todayPlan]);

  const pct = Math.round((planMinutes / Math.max(1, bundle.paceStatus.plannedMinutes)) * 100);
  const pace = paceCopy[bundle.paceStatus.pace] ?? paceCopy.on_target;

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <div className="flex flex-col gap-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-950/30 backdrop-blur">
          <div className="absolute -top-16 left-0 h-48 w-48 rounded-full bg-indigo-500/25 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-20 right-0 h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">
                Today plan
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">Warm-up, deep cases, spaced review</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-300 md:text-base">
                Stay aligned with your goal minutes while the system leans into weak systems and scheduled reviews.
              </p>
            </div>
            <div className={`relative flex w-full max-w-xs items-center gap-4 rounded-3xl border border-slate-800/60 bg-slate-950/80 p-4 text-sm text-slate-300 ${pace.glow}`}>
              <div className="relative h-20 w-20 rounded-full bg-slate-950" style={radialStyle(pct)}>
                <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-slate-950/95">
                  <span className="text-xl font-semibold text-white">{planMinutes}</span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400">min</span>
                </div>
              </div>
              <div>
                <p className={`text-sm font-semibold ${pace.tone}`}>{pace.label}</p>
                <p className="text-xs text-slate-400">Planned {bundle.paceStatus.plannedMinutes} min - Completed {bundle.paceStatus.completedMinutes} min</p>
              </div>
            </div>
          </div>

          <div className="relative mt-8 grid gap-4 lg:grid-cols-3 lg:items-start">
            {bundle.todayPlan.map((block) => (
              <div key={block.id} className="rounded-2xl border border-slate-800/60 bg-slate-950/70 p-5 shadow-lg shadow-indigo-950/20">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-indigo-200">
                  <span>{block.label}</span>
                  <span>{block.items.reduce((acc, item) => acc + item.durationMinutes, 0)} min</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{block.description}</p>
                <ul className="mt-4 space-y-3">
                  {block.items.map((item) => {
                    const status = state.todayPlanStatus[item.id];
                    return (
                      <li key={item.id} className="flex items-start gap-3">
                        <button
                          onClick={() =>
                            setPlanStatus(
                              item.id,
                              status === "completed" ? "pending" : status === "pending" ? "in_progress" : "completed",
                            )
                          }
                          className={`mt-1 h-5 w-5 rounded-full border transition ${
                            status === "completed"
                              ? "border-emerald-400 bg-emerald-500/30"
                              : status === "in_progress"
                                ? "border-indigo-400 bg-indigo-500/20"
                                : "border-slate-700 bg-slate-900"
                          }`}
                          aria-label={`Toggle status for ${item.title}`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="text-xs text-slate-400">{item.durationMinutes} min - {item.type}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/20">
            <div className="absolute -bottom-16 right-0 h-44 w-44 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden="true" />
            <div className="relative flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white md:text-xl">Weakness nudges</h3>
              <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">Adaptive</span>
            </div>
            <ul className="relative mt-4 space-y-4 text-sm text-slate-300">
              {bundle.weaknessNudges.map((nudge) => (
                <li key={nudge.id} className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 shadow-inner shadow-indigo-900/30">
                  <p className="font-semibold text-white">{nudge.message}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.3em] text-indigo-100">{nudge.systems.join(" - ")}</p>
                  <div className="mt-3 flex gap-2">
                    {nudge.recommendedCases.map((caseId) => (
                      <Link
                        key={caseId}
                        href={`${baseHref}/practice/${caseId}`}
                        className="rounded-full border border-indigo-400/40 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-500/20"
                      >
                        View case
                      </Link>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/20">
            <div className="absolute -top-14 right-6 h-32 w-32 rounded-full bg-sky-500/20 blur-3xl" aria-hidden="true" />
            <h3 className="relative text-lg font-semibold text-white md:text-xl">Session modes</h3>
            <p className="relative mt-2 text-sm text-slate-300">Swap modes without leaving the page. Everything stays local until you launch.</p>
            <div className="relative mt-4 grid grid-cols-2 gap-3">
              {bundle.modes.map((mode) => {
                const isActive = state.mode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setMode(mode)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm capitalize transition ${
                      isActive
                        ? "border-indigo-400 bg-gradient-to-br from-indigo-500/30 via-violet-500/30 to-sky-500/20 text-white shadow-lg shadow-indigo-900/30"
                        : "border-slate-800 bg-slate-950/70 text-slate-200 hover:border-indigo-400/60"
                    }`}
                  >
                    <span className="font-semibold text-white">{mode}</span>
                    <p className="mt-1 text-xs text-slate-400">
                      {mode === "study" && "Tutor aids, immediate coaching"}
                      {mode === "exam" && "Strict visuals, proctor timing"}
                      {mode === "rapid" && "Short stems, time sprints"}
                      {mode === "adaptive" && "Difficulty shifts with Elo"}
                      {mode === "custom" && "Design your own mix"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <aside className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-indigo-950/30 p-6 shadow-2xl shadow-indigo-950/30 backdrop-blur">
          <div className="absolute -top-10 left-10 h-24 w-24 rounded-full bg-indigo-500/30 blur-xl" aria-hidden="true" />
          <h3 className="relative text-lg font-semibold text-white">Notifications</h3>
          <ul className="relative mt-4 space-y-4 text-sm text-indigo-100">
            {bundle.notifications.map((notif) => (
              <li key={notif.id} className="rounded-2xl border border-indigo-400/30 bg-slate-950/60 p-4 shadow-inner shadow-indigo-900/40">
                <p className="font-semibold text-white">{notif.message}</p>
                {notif.detail && <p className="mt-1 text-xs text-indigo-200/80">{notif.detail}</p>}
                {notif.actionHref && notif.actionLabel && (
                  <Link
                    href={notif.actionHref}
                    className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-indigo-200 transition hover:text-white"
                  >
                    {notif.actionLabel}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 text-sm text-slate-300 shadow-lg shadow-indigo-950/20">
          <h3 className="text-lg font-semibold text-white">Keyboard flow</h3>
          <p className="mt-2 text-xs text-slate-400">Keep hands on keys during cases.</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            {[
              ["1-5", "Answer choices"],
              ["Enter", "Submit"],
              ["C", "Confidence"],
              ["H", "Highlight"],
              ["S", "Strike"],
              ["]", "Open drawer"],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 rounded-xl border border-slate-800/60 bg-slate-950/70 px-3 py-2 shadow-inner shadow-indigo-950/20">
                <kbd className="rounded bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-slate-200">{key}</kbd>
                <span>{label}</span>
              </div>
            ))}
          </dl>
        </section>
      </aside>
    </div>
  );
}
