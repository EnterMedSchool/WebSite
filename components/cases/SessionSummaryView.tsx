"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePractice } from "./PracticeProvider";

export default function SessionSummaryView() {
  const { bundle } = usePractice();
  const baseHref = `/cases/${bundle.collection.slug}`;
  const summary = bundle.sessionSummary;
  const accuracyPct = Math.round(summary.accuracy * 100);
  const calibrationRows = useMemo(() => {
    const total = summary.confidenceCurve.reduce((acc, row) => acc + row.total, 0);
    return summary.confidenceCurve.map((row) => ({
      ...row,
      accuracy: row.total ? Math.round((row.correct / row.total) * 100) : 0,
      share: total ? Math.round((row.total / total) * 100) : 0,
    }));
  }, [summary.confidenceCurve]);

  return (
    <div className="space-y-8">
      <header className="relative grid gap-6 rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-950/30 backdrop-blur md:grid-cols-3">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-sky-500/10" aria-hidden="true" />
        <SummaryStat label="Accuracy" value={`${accuracyPct}%`} description="Block correctness with tutor mode off." tone="emerald" />
        <SummaryStat label="Average time" value={`${Math.round(summary.averageTimeSeconds)}s`} description="Median response speed across the session." tone="indigo" />
        <SummaryStat label="Peer percentile" value={summary.peerPercentile != null ? `${summary.peerPercentile}th` : "--"} description="Anonymized cohort vs your test date." tone="cyan" />
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/20">
          <div className="absolute -top-16 left-0 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-14 right-0 h-44 w-44 rounded-full bg-sky-500/15 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <h3 className="text-lg font-semibold text-white md:text-xl">Confidence calibration</h3>
            <p className="mt-2 text-sm text-slate-300">Aim for high-confidence answers above 80 percent. Low confidence should trigger your process checklist.</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              {calibrationRows.map((row) => (
                <li key={row.confidence} className="rounded-2xl border border-slate-800/60 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{row.confidence.toUpperCase()}</span>
                    <span className="text-xs text-slate-400">{row.share}% of attempts</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-800/80">
                    <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500" style={{ width: `${row.accuracy}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Accuracy {row.accuracy}% ({row.correct}/{row.total})</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/20">
            <div className="absolute -top-12 right-0 h-36 w-36 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <h3 className="text-lg font-semibold text-white md:text-xl">Queued reviews</h3>
              <p className="mt-2 text-sm text-slate-300">Next seven days spaced with FSRS cadence.</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {bundle.reviewQueue.due.slice(0, 3).map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-950/70 px-3 py-2">
                    <span>{item.caseSlug}</span>
                    <span className="text-xs uppercase tracking-[0.3em] text-indigo-300">{item.urgency}</span>
                  </li>
                ))}
              </ul>
              <Link href={`${baseHref}/review`} className="mt-4 inline-flex text-xs font-semibold text-indigo-200 transition hover:text-white">Open review queue</Link>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 text-sm text-slate-300 shadow-xl shadow-indigo-950/20">
            <h3 className="text-lg font-semibold text-white">Pace report</h3>
            <ul className="mt-3 space-y-2">
              {summary.paceReport.map((entry) => {
                const over = entry.timeSeconds - entry.budgetSeconds;
                const tone = over > 0 ? "text-amber-200" : "text-emerald-200";
                return (
                  <li key={entry.caseSlug} className="rounded-2xl border border-slate-800/60 bg-slate-950/70 px-3 py-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">{entry.caseSlug}</p>
                    <p className={`text-sm font-semibold ${tone}`}>
                      {Math.round(entry.timeSeconds)}s ({over > 0 ? "+" : ""}{Math.round(over)} vs budget)
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/20">
          <div className="absolute -top-16 right-0 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden="true" />
          <h3 className="relative text-lg font-semibold text-white md:text-xl">Blueprint heatmap</h3>
          <p className="relative mt-2 text-sm text-slate-300">Coverage across system and discipline. Darker means stronger accuracy.</p>
          <div className="relative mt-4 grid grid-cols-2 gap-3 text-sm text-slate-200">
            {summary.heatmap.map((cell) => (
              <div key={`${cell.system}-${cell.discipline}`} className="rounded-2xl border border-slate-800/60 bg-slate-950/70 p-3">
                <p className="font-semibold text-white">{cell.system}</p>
                <p className="text-xs text-slate-400">{cell.discipline}</p>
                <div className="mt-2 h-2 rounded-full bg-slate-800/80">
                  <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500" style={{ width: `${Math.round(cell.value * 100)}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-400">{Math.round(cell.value * 100)}% correct</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/20">
          <div className="absolute -bottom-14 left-0 h-48 w-48 rounded-full bg-rose-500/20 blur-3xl" aria-hidden="true" />
          <h3 className="relative text-lg font-semibold text-white md:text-xl">Error fingerprint</h3>
          <p className="relative mt-2 text-sm text-slate-300">Hotspots to coach next block.</p>
          <div className="relative mt-4 space-y-3 text-sm text-slate-200">
            {Object.entries(summary.errorFingerprint).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between">
                  <span className="capitalize text-white">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className="text-xs text-slate-400">{Math.round(value * 100)}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-800/80">
                  <div className="h-2 rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-indigo-500" style={{ width: `${Math.round(value * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryStat({ label, value, description, tone }: { label: string; value: string; description: string; tone: "emerald" | "indigo" | "cyan" }) {
  const toneMap: Record<string, string> = {
    emerald: "text-emerald-200",
    indigo: "text-indigo-200",
    cyan: "text-cyan-200",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/70 p-5 text-sm text-slate-300 shadow-lg shadow-indigo-950/20">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-transparent to-slate-900/10" aria-hidden="true" />
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">{label}</p>
        <p className={`mt-2 text-2xl font-semibold ${toneMap[tone]}`}>{value}</p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}
