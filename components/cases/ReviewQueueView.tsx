"use client";

import { useMemo, useState } from "react";
import { usePractice } from "./PracticeProvider";

const tabs = [
  { key: "due", label: "Due" },
  { key: "upcoming", label: "Upcoming" },
  { key: "suspended", label: "Suspended" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const urgencyTone: Record<string, string> = {
  overdue: "bg-rose-500/20 text-rose-100 border-rose-500/40",
  today: "bg-emerald-500/20 text-emerald-100 border-emerald-500/40",
  tomorrow: "bg-indigo-500/20 text-indigo-100 border-indigo-500/40",
  this_week: "bg-sky-500/20 text-sky-100 border-sky-500/40",
};

export default function ReviewQueueView() {
  const { bundle } = usePractice();
  const [activeTab, setActiveTab] = useState<TabKey>("due");
  const queue = bundle.reviewQueue;
  const list = queue[activeTab];
  const summary = useMemo(
    () => `Due ${queue.due.length}  -  Upcoming ${queue.upcoming.length}  -  Suspended ${queue.suspended.length}`,
    [queue.due.length, queue.upcoming.length, queue.suspended.length],
  );

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/30 backdrop-blur">
        <div className="absolute -top-12 right-0 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white md:text-3xl">Review queue</h2>
            <p className="mt-2 text-sm text-slate-300 md:text-base">FSRS cadence keeps high-yield memories fresh without overload.</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
            {summary}
          </span>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 text-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 font-semibold transition ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 text-white shadow-lg shadow-indigo-900/30"
                : "bg-slate-900/70 text-slate-200 hover:bg-slate-900/90"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <ul className="space-y-4">
        {list.length === 0 && (
          <li className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 text-sm text-slate-300">
            Nothing queued here. Try a micro review or let Smart Builder queue a variant.
          </li>
        )}
        {list.map((item) => {
          const tone = urgencyTone[item.urgency] ?? "bg-slate-800/80 text-slate-200 border-slate-700";
          return (
            <li
              key={item.id}
              className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/60 p-5 shadow-xl shadow-indigo-950/20"
            >
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-indigo-500/10 to-transparent" aria-hidden="true" />
              <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white md:text-xl">{item.caseSlug}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Mode {item.mode}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full border px-3 py-1 font-semibold ${tone}`}>{item.urgency}</span>
                  <button className="rounded-full bg-slate-900/80 px-3 py-1 text-slate-200 transition hover:bg-slate-800/80">
                    Postpone tonight
                  </button>
                  <button className="rounded-full bg-slate-900/80 px-3 py-1 text-slate-200 transition hover:bg-slate-800/80">
                    Postpone tomorrow
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
