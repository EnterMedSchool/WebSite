"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePractice } from "./PracticeProvider";
import type { CaseGraph, CaseStage, CaseStageOption } from "@/lib/cases/types";

export default function CaseDebrief({ caseId }: { caseId: string }) {
  const { bundle } = usePractice();
  const baseHref = `/cases/${bundle.collection.slug}`;
  const caseSummary = bundle.cases.find((entry) => entry.id === caseId || entry.slug === caseId) ?? bundle.cases[0];
  const graph = caseSummary.graph;

  const phaseGroups = useMemo(() => (graph ? groupStages(graph) : []), [graph]);
  const goldenPath = useMemo(() => (graph ? computeGoldenPath(graph) : []), [graph]);

  if (!graph) {
    return (
      <div className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-10 text-center text-slate-200">
        <h2 className="text-xl font-semibold text-white">Debrief coming soon</h2>
        <p className="mt-2 text-sm text-slate-300">
          This case still uses the legacy format. Replay the case or choose another while we finish migrating the debrief.
        </p>
        <Link href={baseHref} className="mt-6 inline-flex items-center rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
          Browse cases
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-950/30 backdrop-blur">
        <div className="absolute -top-16 left-0 h-48 w-48 rounded-full bg-indigo-500/25 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="inline-flex items-center rounded-full bg-indigo-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200">
              Case debrief
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">{caseSummary.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300 md:text-base">
              {caseSummary.overview ?? caseSummary.subtitle ?? "Review the optimal path and alternative branches."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <Chip label="Phase count" value={`${caseSummary.phaseCount}`} />
            <Chip label="Stages" value={`${caseSummary.stageCount}`} />
            <Chip label="Estimated" value={`${caseSummary.estimatedMinutes} min`} />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-emerald-50 shadow-xl shadow-emerald-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.35),transparent_60%),radial-gradient(circle_at_85%_30%,rgba(56,189,248,0.25),transparent_60%)]" aria-hidden="true" />
        <div className="relative">
          <h2 className="text-2xl font-semibold">Golden pathway</h2>
          <p className="mt-2 text-sm text-emerald-100/80">
            Follow the high-yield route from presentation to management. We surface one exemplary branch per stage.
          </p>
          <div className="mt-5 space-y-4">
            {goldenPath.map((segment) => (
              <div key={segment.stage.slug} className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 shadow-inner shadow-emerald-900/20">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
                      Phase {segment.stage.phase} - {segment.stage.title}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">{segment.option.label}</p>
                    {segment.option.description && <p className="mt-1 text-sm text-emerald-100/90">{segment.option.description}</p>}
                  </div>
                  <div className="flex flex-col items-end text-xs text-emerald-100/80">
                    <span className="rounded-full border border-emerald-400/40 px-3 py-1 uppercase tracking-[0.2em]">{segment.stage.stageType}</span>
                    <span className="mt-2 rounded-full bg-emerald-500/20 px-2 py-1 font-semibold text-emerald-50">
                      {segment.option.costTime ?? 0} min - {segment.option.scoreDelta ?? 0} pts
                    </span>
                  </div>
                </div>
                {segment.option.reveals.length > 0 && (
                  <ul className="mt-3 space-y-2 text-sm text-emerald-100">
                    {segment.option.reveals.map((item, idx) => (
                      <li key={idx} className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {segment.option.outcomes?.feedback && (
                  <p className="mt-3 text-xs text-emerald-200/80">{String(segment.option.outcomes.feedback)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          {phaseGroups.map((group) => (
            <div key={group.phase} className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/20">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">
                    Phase {group.phase} - {group.phase === 1 ? "Find the diagnosis" : "Management cascade"}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Stage breakdown</h3>
                </div>
                <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-400">{group.stages.length} stages</span>
              </header>
              <div className="mt-4 space-y-4">
                {group.stages.map((stage) => (
                  <StageInsight key={stage.slug} stage={stage} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5 text-sm text-slate-200 shadow-xl shadow-indigo-950/10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Tags & focus</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200">
              {(caseSummary.tags ?? ["endocrine", "diagnostic reasoning"]).map((tag) => (
                <span key={tag} className="rounded-full border border-slate-800 px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-4 grid gap-2 text-xs text-slate-400">
              <span>Systems: {caseSummary.system ?? caseSummary.subjectName}</span>
              <span>Skills: {(caseSummary.skills ?? ["Algorithm"]).join(", ")}</span>
              <span>Physician tasks: {(caseSummary.physicianTasks ?? ["Order tests", "Management"]).join(", ")}</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5 text-sm text-slate-200 shadow-xl shadow-indigo-950/10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Replay</p>
            <p className="mt-2 text-xs text-slate-400">Jump back in to explore alternative branches or speed-run the golden path.</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link href={`${baseHref}/practice/${caseSummary.id}`} className="rounded-full bg-indigo-500 px-4 py-2 font-semibold text-white hover:bg-indigo-400">
                Re-run case
              </Link>
              <Link href={baseHref} className="rounded-full border border-slate-800 px-4 py-2 text-slate-200 hover:border-slate-600">
                Case hub
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

type StageGroup = { phase: number; stages: CaseStage[] };

type GoldenSegment = { stage: CaseStage; option: CaseStageOption };

function groupStages(graph: CaseGraph): StageGroup[] {
  const stagesByPhase = new Map<number, CaseStage[]>();
  graph.stages.forEach((stage) => {
    if (!stagesByPhase.has(stage.phase)) stagesByPhase.set(stage.phase, []);
    stagesByPhase.get(stage.phase)!.push(stage);
  });
  return Array.from(stagesByPhase.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([phase, stages]) => ({ phase, stages: stages.sort((a, b) => a.orderIndex - b.orderIndex) }));
}

function computeGoldenPath(graph: CaseGraph): GoldenSegment[] {
  const segments: GoldenSegment[] = [];
  const stageMap = graph.stageMap;
  const ordered = [...graph.stages].sort((a, b) => (a.phase === b.phase ? a.orderIndex - b.orderIndex : a.phase - b.phase));
  let currentSlug = graph.entryStageSlug || ordered[0]?.slug;
  const visited = new Set<string>();

  while (currentSlug && !visited.has(currentSlug)) {
    visited.add(currentSlug);
    const stage = stageMap[currentSlug];
    if (!stage) break;
    const preferred = pickPreferredOption(stage);
    if (preferred) {
      segments.push({ stage, option: preferred });
      currentSlug = preferred.advanceTo ?? findNextSlug(ordered, stage.slug);
    } else {
      currentSlug = findNextSlug(ordered, stage.slug);
    }
  }

  return segments;
}

function pickPreferredOption(stage: CaseStage): CaseStageOption | undefined {
  const correct = stage.options.find((opt) => opt.isCorrect);
  if (correct) return correct;
  return stage.options[0];
}

function findNextSlug(ordered: CaseStage[], currentSlug: string): string | null {
  const index = ordered.findIndex((stage) => stage.slug === currentSlug);
  if (index === -1) return null;
  return ordered[index + 1]?.slug ?? null;
}

function StageInsight({ stage }: { stage: CaseStage }) {
  const correct = stage.options.filter((opt) => opt.isCorrect);
  const alternates = stage.options.filter((opt) => !opt.isCorrect);
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-950/70 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span className="rounded-full border border-slate-800 px-3 py-1 uppercase tracking-[0.25em]">{stage.stageType}</span>
        <span className="text-[11px] uppercase tracking-[0.2em]">Phase {stage.phase}</span>
      </header>
      <h4 className="mt-2 text-lg font-semibold text-white">{stage.title}</h4>
      {stage.subtitle && <p className="mt-1 text-sm text-slate-300">{stage.subtitle}</p>}
      {stage.info.length > 0 && (
        <ul className="mt-3 space-y-2 text-sm text-slate-200">
          {stage.info.map((item, idx) => (
            <li key={idx} className="rounded-xl border border-slate-800/60 bg-slate-900/60 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      )}
      {correct.length > 0 && (
        <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-200">High-yield move</p>
          {correct.map((option) => (
            <div key={option.value} className="mt-2">
              <p className="font-semibold text-white">{option.label}</p>
              {option.description && <p className="mt-1 text-emerald-100/80">{option.description}</p>}
              <MetaRow option={option} />
            </div>
          ))}
        </div>
      )}
      {alternates.length > 0 && (
        <div className="mt-4 space-y-3 text-sm text-slate-200">
          {alternates.map((option) => (
            <div key={option.value} className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3">
              <p className="font-semibold text-white">{option.label}</p>
              {option.description && <p className="mt-1 text-rose-100/80">{option.description}</p>}
              <MetaRow option={option} />
              {option.outcomes?.feedback && (
                <p className="mt-1 text-xs text-rose-100/70">{String(option.outcomes.feedback)}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetaRow({ option }: { option: CaseStageOption }) {
  const cost = option.costTime ?? 0;
  const delta = option.scoreDelta ?? 0;
  return (
    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
      <span className="rounded-full border border-slate-800 px-2 py-1">Cost {cost} min</span>
      <span className="rounded-full border border-slate-800 px-2 py-1">
        {delta >= 0 ? "+" : ""}
        {delta} pts
      </span>
      {option.advanceTo && <span className="rounded-full border border-slate-800 px-2 py-1">Next ? {option.advanceTo}</span>}
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300">
      {label}: <span className="ml-1 font-semibold text-white">{value}</span>
    </span>
  );
}


