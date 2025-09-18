"use client";

import { usePractice } from "./PracticeProvider";

export default function PracticeDashboard() {
  const { bundle } = usePractice();
  const dashboard = bundle.dashboard;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-950/30 backdrop-blur">
        <div className="absolute -top-20 left-10 h-48 w-48 rounded-full bg-indigo-500/25 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-16 right-0 h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative grid gap-6 md:grid-cols-[2fr,1fr]">
          <div>
            <h2 className="text-2xl font-semibold text-white md:text-3xl">Mastery trend</h2>
            <p className="mt-2 text-sm text-slate-300 md:text-base">Rolling 28 day mastery score combining coverage, calibration, and pace.</p>
            <div className="mt-6 flex items-end gap-3">
              {dashboard.masteryTrend.map((point) => (
                <div key={point.date} className="flex flex-col items-center text-xs text-slate-400">
                  <div className="w-8 rounded-t bg-gradient-to-t from-indigo-500 to-sky-500" style={{ height: `${point.value}px` }} />
                  <span className="mt-2">{new Date(point.date).getDate()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 text-sm text-slate-300">
            <StatCard label="Streak" value={`${dashboard.streak} days`} hint="Active study days in a row." />
            <StatCard label="Minutes" value={`${dashboard.minutes.value} min`} hint="Focused minutes logged this week." />
            <StatCard label="Exam readiness" value={`${dashboard.examReadiness.value}/100`} hint={dashboard.examReadiness.description} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/20">
          <div className="absolute -top-16 right-0 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden="true" />
          <h3 className="relative text-lg font-semibold text-white md:text-xl">Coverage heatmap</h3>
          <div className="relative mt-3 grid grid-cols-2 gap-3 text-sm text-slate-200">
            {dashboard.coverageHeatmap.map((cell) => (
              <div key={`${cell.system}-${cell.discipline}`} className="rounded-2xl border border-slate-800/60 bg-slate-950/70 p-3">
                <p className="font-semibold text-white">{cell.system}</p>
                <p className="text-xs text-slate-400">{cell.discipline}</p>
                <div className="mt-2 h-2 rounded-full bg-slate-800/80">
                  <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500" style={{ width: `${Math.round(cell.value * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/20">
          <div className="absolute -bottom-16 left-0 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden="true" />
          <h3 className="relative text-lg font-semibold text-white md:text-xl">Biggest movers</h3>
          <ul className="relative mt-3 space-y-2 text-sm text-slate-200">
            {dashboard.biggestMovers.map((mover) => (
              <li key={mover.area} className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-950/70 p-3">
                <span>{mover.area}</span>
                <span className={mover.delta >= 0 ? "text-emerald-200" : "text-rose-200"}>{mover.delta >= 0 ? "+" : ""}{mover.delta}%</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Tile label="Bias monitor" items={dashboard.biasMonitor.map((item) => `${item.label}: ${item.impact}`)} />
        <Tile label="Time budget" items={[`${dashboard.timeBudget.value}s median per item`, dashboard.timeBudget.description]} />
        <Tile label="Image skills" items={[`${dashboard.imageSkills.value}% correct`, dashboard.imageSkills.description]} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Tile label="Study quality" items={[`${dashboard.studyQuality.value}/100 quality index`, dashboard.studyQuality.description]} />
        <Tile label="Resource leverage" items={dashboard.resourceLeverage.map((item) => `${item.resource}: ${item.effect}`)} />
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/20">
        <div className="absolute -top-14 right-0 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden="true" />
        <h3 className="relative text-lg font-semibold text-white md:text-xl">Insights</h3>
        <ul className="relative mt-3 space-y-2 text-sm text-slate-200">
          {dashboard.insights.map((insight, idx) => (
            <li key={idx} className="rounded-2xl border border-slate-800/60 bg-slate-950/70 p-3">
              {insight}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/70 p-4 text-sm text-slate-300 shadow-lg shadow-indigo-950/20">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-transparent to-slate-900/20" aria-hidden="true" />
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">{label}</p>
        <p className="mt-2 text-xl font-semibold text-indigo-200">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      </div>
    </div>
  );
}

function Tile({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 text-sm text-slate-200 shadow-xl shadow-indigo-950/20">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-transparent to-slate-900/20" aria-hidden="true" />
      <div className="relative">
        <h3 className="text-lg font-semibold text-white md:text-xl">{label}</h3>
        <ul className="mt-3 space-y-2 text-xs text-slate-400">
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
