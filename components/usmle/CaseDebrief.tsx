"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePractice } from "./PracticeProvider";
import type { ClinicalCase, ReasoningNode } from "@/lib/usmle/types";

export default function CaseDebrief({ caseId }: { caseId: string }) {
  const { bundle, state } = usePractice();
  const caseData = bundle.cases.find((current) => current.id === caseId) ?? bundle.cases[0];
  const answer = state.answers[caseData.id];
  const correctChoice = caseData.question.choices.find((choice) => choice.id === caseData.question.answerId);
  const pickedChoice = answer ? caseData.question.choices.find((choice) => choice.id === answer.choiceId) : undefined;
  const isCorrect = answer ? answer.choiceId === caseData.question.answerId : true;

  const tlDr = caseData.subtitle || "Synthesize the pathway from presentation to diagnosis.";
  const highlightLabs = useMemo(() => caseData.labs.slice(0, 3), [caseData.labs]);

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
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">{caseData.title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">{tlDr}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <ResultPill isCorrect={isCorrect} />
            <ConfidenceBadge confidence={answer?.confidence} />
            <TimeBadge elapsed={answer?.timeSeconds} budget={caseData.question.metadata?.timeBudgetSeconds} />
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/20">
            <div className="absolute -top-12 right-0 h-36 w-36 rounded-full bg-rose-500/15 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <h3 className="text-lg font-semibold text-white md:text-xl">Why right versus wrong</h3>
              <p className="mt-2 text-sm text-slate-300">Anchor on discriminators and distractor traps. Study mode rationales appear immediately.</p>
              <div className="mt-4 space-y-3">
                {caseData.question.choices.map((choice) => {
                  const highlight = choice.id === caseData.question.answerId;
                  const picked = pickedChoice?.id === choice.id;
                  return (
                    <div
                      key={choice.id}
                      className={`rounded-2xl border p-4 text-sm shadow ${
                        highlight
                          ? "border-emerald-400/70 bg-emerald-500/10 shadow-emerald-500/20"
                          : picked
                            ? "border-rose-400/70 bg-rose-500/10 shadow-rose-500/20"
                            : "border-slate-800/60 bg-slate-950/70 shadow-indigo-950/10"
                      }`}
                    >
                      <p className="font-semibold text-white">{choice.text}</p>
                      <p className="mt-1 text-slate-300">{choice.rationale}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/20">
            <div className="absolute -bottom-12 left-0 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <h3 className="text-lg font-semibold text-white md:text-xl">Reasoning map</h3>
              <p className="mt-2 text-sm text-slate-300">Trace presentation to narrowed differential to final decision. Click through to recap supporting evidence.</p>
              <div className="mt-4 rounded-2xl border border-slate-800/60 bg-slate-950/70 p-4">
                <ReasoningTree node={caseData.reasoningMap} depth={0} />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/20">
            <div className="absolute -top-12 left-0 h-32 w-32 rounded-full bg-amber-500/15 blur-2xl" aria-hidden="true" />
            <h3 className="relative text-lg font-semibold text-white md:text-xl">Bias coach</h3>
            <ul className="relative mt-3 space-y-2 text-sm text-slate-300">
              {caseData.biasTags.map((bias) => (
                <li key={bias.id} className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-100 shadow-inner shadow-amber-500/20">
                  <p className="font-semibold text-amber-50">{bias.label}</p>
                  <p className="mt-1 text-amber-50/80">{bias.description}</p>
                </li>
              ))}
              {caseData.biasTags.length === 0 && <li className="rounded-2xl border border-slate-800/60 bg-slate-950/70 p-4 text-slate-400">No bias flags triggered. Continue using the checklist steps.</li>}
            </ul>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/20">
            <div className="absolute -top-10 right-0 h-28 w-28 rounded-full bg-sky-500/20 blur-3xl" aria-hidden="true" />
            <h3 className="relative text-lg font-semibold text-white">Key labs and images</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {highlightLabs.map((lab) => (
                <li key={lab.id} className="rounded-2xl border border-slate-800/60 bg-slate-950/70 p-3">
                  <p className="font-semibold text-white">{lab.name}</p>
                  <p className="text-xs text-slate-400">{lab.value} {lab.unit} (ref {lab.reference})</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 text-sm text-slate-300 shadow-xl shadow-indigo-950/20">
            <div className="absolute -bottom-16 left-0 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" aria-hidden="true" />
            <h3 className="relative text-lg font-semibold text-white">Mini lecture</h3>
            <p className="mt-2">Pituitary ACTH adenomas maintain partial feedback; high-dose dex suppresses cortisol compared with ectopic sources.</p>
            <p className="mt-2">Contrast with adrenal tumors (low ACTH) and ectopic ACTH (no suppression, smoking link).</p>
            <button className="mt-4 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:translate-y-[-1px]">
              Pearl mode 30s
            </button>
          </div>

          <div className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 text-sm text-slate-300 shadow-xl shadow-indigo-950/20">
            <h3 className="text-lg font-semibold text-white">Course link</h3>
            {caseData.resources.filter((resource) => resource.label.toLowerCase().includes("course")).map((resource) => (
              <Link key={resource.id} href={resource.href} className="mt-3 block text-sm font-semibold text-indigo-200 transition hover:text-white">
                {resource.label} - {resource.timestamp ?? "Clip"}
              </Link>
            ))}
            <p className="mt-3 text-xs text-slate-400">Watching boosts endocrine accuracy by 18 percent in the next session.</p>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {caseData.artifacts.map((artifact) => (
          <div key={artifact.id} className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-5 text-sm text-slate-300 shadow-xl shadow-indigo-950/20">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-transparent to-sky-500/10" aria-hidden="true" />
            <div className="relative">
              <span className="text-xs uppercase tracking-[0.35em] text-indigo-200">{artifact.type}</span>
              <h4 className="mt-2 text-lg font-semibold text-white">{artifact.title}</h4>
              <p className="mt-2 text-slate-200">{artifact.body}</p>
              <div className="mt-4 flex gap-2 text-xs">
                <button className="rounded-full border border-indigo-400/40 bg-slate-950/70 px-3 py-1 text-indigo-100 hover:bg-indigo-500/20">
                  Add to review
                </button>
                <button className="rounded-full bg-indigo-500 px-3 py-1 text-white hover:bg-indigo-400">
                  Share
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-950/30">
        <div className="absolute -top-12 right-0 h-44 w-44 rounded-full bg-sky-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white md:text-xl">Next best action</h3>
            <p className="text-sm text-slate-300">Two endocrinology algorithm cases queued for tomorrow. Queue a mini-algorithm review now?</p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/usmle/review" className="rounded-full border border-slate-800/60 bg-slate-950/70 px-4 py-2 text-slate-200 hover:bg-slate-800/80">
              Review later
            </Link>
            <button className="rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 px-4 py-2 font-semibold text-white shadow-lg shadow-indigo-900/30 hover:translate-y-[-1px]">
              Re-do now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ResultPill({ isCorrect }: { isCorrect: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        isCorrect ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"
      }`}
    >
      {isCorrect ? "Correct" : "Missed"}
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence?: "low" | "medium" | "high" }) {
  if (!confidence) {
    return <span className="rounded-full bg-slate-900/70 px-3 py-1 text-xs text-slate-300">Confidence --</span>;
  }
  const tone = confidence === "high" ? "text-emerald-200" : confidence === "medium" ? "text-sky-200" : "text-amber-200";
  return <span className={`rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold ${tone}`}>Confidence {confidence}</span>;
}

function TimeBadge({ elapsed, budget }: { elapsed?: number; budget?: number }) {
  if (!elapsed) {
    return <span className="rounded-full bg-slate-900/70 px-3 py-1 text-xs text-slate-300">Time --</span>;
  }
  const budgetSeconds = budget ?? 120;
  const delta = elapsed - budgetSeconds;
  const tone = delta <= 0 ? "text-emerald-200" : "text-amber-200";
  return <span className={`rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold ${tone}`}>Time {formatTime(elapsed)}</span>;
}

function ReasoningTree({ node, depth }: { node: ReasoningNode; depth: number }) {
  return (
    <div className="pl-4">
      <div className="rounded-2xl border border-slate-800/60 bg-slate-950/70 p-3">
        <p className="text-sm font-semibold text-white">{node.label}</p>
        <p className="mt-1 text-xs text-slate-400">{node.detail}</p>
        <ul className="mt-2 space-y-1 text-xs text-slate-500">
          {node.supportingEvidence.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="mt-3 space-y-3 border-l border-slate-800/60 pl-4">
          {node.children.map((child) => (
            <ReasoningTree key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number) {
  if (!seconds) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
