"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePractice } from "./PracticeProvider";

export default function CasesLibraryView() {
  const { bundle } = usePractice();
  const [query, setQuery] = useState("");
  const [systemFilter, setSystemFilter] = useState<string>("All");
  const [difficulty, setDifficulty] = useState<string>("All");

  const systems = useMemo(() => ["All", ...new Set(bundle.cases.map((c) => c.system))], [bundle.cases]);
  const difficulties = useMemo(() => ["All", ...new Set(bundle.cases.map((c) => c.difficulty))], [bundle.cases]);

  const filtered = bundle.cases.filter((c) => {
    const matchesQuery = query.trim().length === 0 || `${c.title} ${c.subtitle}`.toLowerCase().includes(query.toLowerCase());
    const matchesSystem = systemFilter === "All" || c.system === systemFilter;
    const matchesDiff = difficulty === "All" || c.difficulty === difficulty;
    return matchesQuery && matchesSystem && matchesDiff;
  });

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/30 backdrop-blur">
        <div className="absolute -top-16 left-0 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-12 right-0 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white md:text-3xl">Case library</h2>
            <p className="mt-2 text-sm text-slate-300 md:text-base">Explore multi-step cases tagged by system, physician task, skills, and difficulty.</p>
          </div>
          <Link
            href="/usmle/build"
            className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:translate-y-[-1px] hover:shadow-indigo-700/30"
          >
            Build session
          </Link>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search chief complaint or discriminator"
          className="rounded-3xl border border-slate-800/60 bg-slate-950/70 px-4 py-3 text-sm text-white shadow-inner shadow-indigo-950/20 focus:border-indigo-500 focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
          <select
            value={systemFilter}
            onChange={(event) => setSystemFilter(event.target.value)}
            className="rounded-3xl border border-slate-800/60 bg-slate-950/70 px-4 py-3 focus:border-indigo-500 focus:outline-none"
          >
            {systems.map((system) => (
              <option key={system} value={system}>
                {system}
              </option>
            ))}
          </select>
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="rounded-3xl border border-slate-800/60 bg-slate-950/70 px-4 py-3 focus:border-indigo-500 focus:outline-none"
          >
            {difficulties.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((c) => (
          <article
            key={c.id}
            className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-lg shadow-indigo-950/20 transition hover:translate-y-[-2px] hover:shadow-indigo-800/30"
          >
            <div className="absolute -top-10 right-0 h-32 w-32 rounded-full bg-indigo-500/15 blur-2xl" aria-hidden="true" />
            <div className="relative flex items-center justify-between text-xs text-slate-400">
              <span>{c.system} - {c.discipline}</span>
              <span className="rounded-full bg-slate-900/80 px-3 py-1 uppercase tracking-[0.3em] text-indigo-300">{c.difficulty}</span>
            </div>
            <h3 className="relative mt-4 text-lg font-semibold text-white md:text-xl">{c.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{c.subtitle}</p>
            <p className="mt-3 text-xs text-slate-400">Tasks: {c.physicianTasks.join(", ")} - Skills: {c.skills.join(", ")}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <Link
                href={`/usmle/practice/${c.id}`}
                className="rounded-full bg-indigo-500 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-400"
              >
                Open case
              </Link>
              <Link
                href={`/usmle/debrief/${c.id}`}
                className="rounded-full bg-slate-900/80 px-4 py-2 text-slate-200 hover:bg-slate-800/80"
              >
                Preview debrief
              </Link>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 text-sm text-slate-300">
            No cases match your filters. Relax difficulty or include experimental stems.
          </p>
        )}
      </div>
    </div>
  );
}
