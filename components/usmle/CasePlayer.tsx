"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePractice } from "./PracticeProvider";
import type { ClinicalCase } from "@/lib/usmle/types";

interface CasePlayerProps {
  caseId: string;
}

const confidenceLevels: Array<{ key: "low" | "medium" | "high"; label: string }> = [
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
];

const drawerTabs = [
  { key: "scratch", label: "Scratchpad" },
  { key: "differential", label: "Mini differential" },
  { key: "heuristics", label: "Heuristics coach" },
  { key: "formula", label: "Formula pad" },
];

export default function CasePlayer({ caseId }: CasePlayerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { bundle, state, recordAnswer, consumeHint, toggleDrawer } = usePractice();
  const caseData = bundle.cases.find((c) => c.id === caseId);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<"low" | "medium" | "high">("medium");
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [drawerTab, setDrawerTab] = useState(drawerTabs[0].key);
  const [scratchpad, setScratchpad] = useState("Gather vitals, endocrine features...");
  const [miniDifferential, setMiniDifferential] = useState<string[]>(["Pituitary adenoma", "Ectopic ACTH"]);
  const [newDx, setNewDx] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "]") {
        event.preventDefault();
        toggleDrawer("right");
      }
      if (!submitted && !showConfirm) {
        if (event.key >= "1" && event.key <= "5") {
          const idx = Number(event.key) - 1;
          const choice = caseData?.question.choices[idx];
          if (choice) setSelectedChoice(choice.id);
        }
        if (event.key.toLowerCase() === "c") {
          setConfidence((prev) => {
            if (prev === "low") return "medium";
            if (prev === "medium") return "high";
            return "low";
          });
        }
      }
      if (event.key === "Enter" && !showConfirm && !submitted) {
        event.preventDefault();
        if (selectedChoice) {
          setShowConfirm(true);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [caseData, selectedChoice, submitted, showConfirm, toggleDrawer]);

  useEffect(() => {
    setSelectedChoice(null);
    setSubmitted(false);
    setShowConfirm(false);
    setElapsed(0);
  }, [caseId]);

  useEffect(() => {
    toggleDrawer("right");
  }, [toggleDrawer]);

  if (!caseData) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-200">
        <p>Case not found. <button className="text-indigo-300 underline" onClick={() => router.back()}>Go back</button></p>
      </div>
    );
  }

  const isStudyMode = state.mode !== "exam";
  const isCorrect = selectedChoice === caseData.question.answerId;

  const feedback = submitted
    ? {
        picked: caseData.question.choices.find((choice) => choice.id === selectedChoice),
        correctChoice: caseData.question.choices.find((choice) => choice.id === caseData.question.answerId),
        isCorrect,
      }
    : null;

  const orderable = caseData.orderableTests;
  const openDrawer = state.openDrawers["right"] ?? true;

  const handleSubmit = () => {
    if (!selectedChoice) return;
    recordAnswer(caseData.id, selectedChoice, confidence, elapsed);
    setSubmitted(true);
    setShowConfirm(false);
  };

  const handleAddDx = () => {
    if (!newDx.trim()) return;
    setMiniDifferential((prev) => [...prev, newDx.trim()]);
    setNewDx("");
  };

  return (
    <div className="relative flex gap-6">
      <div className="flex-1">
        <TopBar
          elapsed={elapsed}
          mode={state.mode}
          confidence={confidence}
          setConfidence={setConfidence}
          submitted={submitted}
          pathname={pathname}
        />

        {state.mode === "exam" && (
          <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-900/80 px-5 py-3 text-xs text-slate-300">
            <p className="font-semibold text-white">Proctor bar</p>
            <p className="mt-1">Budget 90s/item  -  Break in 35 min  -  Testing noise on.</p>
            <p className="mt-1 text-slate-400">Strict silence - feedback unlocks after the block.</p>
          </div>
        )}
        <div className="mt-6 space-y-6">
          {caseData.steps.map((step, idx) => (
            <section key={step.title} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200">
                  Step {idx + 1}
                </span>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              </div>
              <p className="mt-3 text-sm text-slate-200">{renderHighlights(step.body, step.highlights)}</p>
              {step.image && (
                <figure className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-950">
                    <div className="flex h-full items-center justify-center text-slate-500 text-sm">{step.image.alt}</div>
                  </div>
                  <figcaption className="mt-2 text-xs text-slate-400">Zoom & adjust brightness in full implementation.</figcaption>
                </figure>
              )}
              {idx === 3 && (
                <LabsTable labs={caseData.labs} />
              )}
              {idx === 3 && isStudyMode && (
                <OrderTestsPanel tests={orderable} />
              )}
            </section>
          ))}

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200">Decision</span>
              <h3 className="text-lg font-semibold text-white">{caseData.question.prompt}</h3>
            </div>
            <div className="mt-4 space-y-3">
              {caseData.question.choices.map((choice, idx) => {
                const active = selectedChoice === choice.id;
                const disabled = submitted;
                const examStyle = state.mode === "exam";
                const highlight = submitted && choice.id === caseData.question.answerId;
                return (
                  <button
                    key={choice.id}
                    disabled={disabled}
                    onClick={() => setSelectedChoice(choice.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-indigo-400 bg-indigo-500/20 text-white"
                        : "border-slate-800 bg-slate-900 text-slate-200 hover:border-indigo-400/50"
                    } ${examStyle ? "font-medium tracking-wide" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-indigo-200">{String.fromCharCode(65 + idx)}</span>
                      <span className="text-sm text-inherit">{choice.text}</span>
                    </div>
                    {submitted && isStudyMode && (
                      <p className={`mt-2 text-xs ${highlight ? "text-emerald-300" : "text-slate-400"}`}>{choice.rationale}</p>
                    )}
                    {submitted && !examStyle && active && !highlight && (
                      <p className="mt-2 text-xs text-rose-300">Changed once? {state.answers[caseData.id]?.changed ? "Yes" : "No"}</p>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-between">
              {isStudyMode && (
                <HintsList caseData={caseData} consumeHint={consumeHint} />
              )}
              <button
                onClick={() => setShowConfirm(true)}
                disabled={!selectedChoice || submitted}
                className="rounded-full bg-indigo-500 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                {state.mode === "exam" ? "Record response" : "Submit"}
              </button>
            </div>
            {feedback && isStudyMode && (
              <div className={`mt-6 rounded-2xl border p-4 ${feedback.isCorrect ? "border-emerald-400/70 bg-emerald-500/10" : "border-rose-400/70 bg-rose-500/10"}`}>
                <p className="text-sm font-semibold text-white">{feedback.isCorrect ? "Correct" : "Let&apos;s review"}</p>
                <p className="mt-2 text-xs text-slate-100">
                  {feedback.isCorrect
                    ? "Nice! Capture why this works in the differential."
                    : `Correct answer: ${feedback.correctChoice?.text}. ${feedback.correctChoice?.rationale}`}
                </p>
              </div>
            )}
            {submitted && (
              <div className="mt-6 flex gap-2">
                <Link href={"/usmle/debrief/" + caseData.id} className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">Debrief</Link>
                <Link href="/usmle/review" className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700">Add to review</Link>
              </div>
            )}
          </section>
        </div>
      </div>

      {isStudyMode && openDrawer && (
        <aside className="sticky top-28 h-[calc(100vh-180px)] w-80 rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Right drawer</h4>
            <button onClick={() => toggleDrawer("right")} className="text-xs text-slate-400 hover:text-white">Close</button>
          </div>
          <div className="mt-4 flex gap-2">
            {drawerTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setDrawerTab(tab.key)}
                className={`flex-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${
                  drawerTab === tab.key ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-4 h-[calc(100%-120px)] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
            {drawerTab === "scratch" && (
              <textarea
                value={scratchpad}
                onChange={(e) => setScratchpad(e.target.value)}
                className="h-full w-full resize-none rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            )}
            {drawerTab === "differential" && (
              <div className="space-y-3">
                <ul className="space-y-2 text-sm">
                  {miniDifferential.map((dx) => (
                    <li key={dx} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">
                      <span>{dx}</span>
                      <button onClick={() => setMiniDifferential((prev) => prev.filter((item) => item !== dx))} className="text-xs text-rose-300">Remove</button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <input
                    value={newDx}
                    onChange={(e) => setNewDx(e.target.value)}
                    placeholder="Add dx"
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                  <button onClick={handleAddDx} className="rounded-xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white">
                    Add
                  </button>
                </div>
              </div>
            )}
            {drawerTab === "heuristics" && (
              <div className="space-y-3 text-sm">
                <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-amber-100">
                  Watch for premature closure - review labs before locking in.
                </p>
                <p className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 p-3 text-indigo-100">
                  Checklist: presentation -&gt; labs -&gt; test ordering -&gt; mechanism. You&apos;re 2/4 completed.
                </p>
              </div>
            )}
            {drawerTab === "formula" && (
              <div className="space-y-3 text-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Common calculators</p>
                <button className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-left text-sm text-slate-200 hover:border-indigo-500/40">
                  Anion gap
                </button>
                <button className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-left text-sm text-slate-200 hover:border-indigo-500/40">
                  FENa
                </button>
                <button className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-left text-sm text-slate-200 hover:border-indigo-500/40">
                  Wells score
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-200">
            <h3 className="text-lg font-semibold text-white">Commit answer?</h3>
            <p className="mt-2">Confidence: <span className="font-semibold text-white">{confidence}</span></p>
            <p className="mt-1">Time spent: <span className="font-semibold text-white">{formatTime(elapsed)}</span> vs median {caseData.question.metadata?.timeBudgetSeconds ?? 120}s</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowConfirm(false)} className="rounded-full px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800">Review</button>
              <button onClick={handleSubmit} className="rounded-full bg-indigo-500 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-400">
                Submit now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TopBar({
  elapsed,
  mode,
  confidence,
  setConfidence,
  submitted,
  pathname,
}: {
  elapsed: number;
  mode: string;
  confidence: "low" | "medium" | "high";
  setConfidence: (c: "low" | "medium" | "high") => void;
  submitted: boolean;
  pathname: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 px-5 py-3">
      <div className="flex items-center gap-4 text-sm text-slate-200">
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.3em] text-indigo-300">{mode === "exam" ? "Exam" : "Study"} mode</span>
        <span>Case 1 / 3</span>
        <span className="font-mono text-white">{formatTime(elapsed)}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {confidenceLevels.map((level) => (
            <button
              key={level.key}
              disabled={submitted}
              onClick={() => setConfidence(level.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                confidence === level.key ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
        <button className="rounded-full px-3 py-1 text-xs text-slate-300 hover:bg-slate-800">Flag</button>
        <Link href={`${pathname ?? ""}?report=1`} className="text-xs text-indigo-300 hover:text-white">
          Report issue
        </Link>
      </div>
    </div>
  );
}

function LabsTable({ labs }: { labs: ClinicalCase["labs"] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
      <table className="w-full text-sm text-slate-200">
        <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.2em] text-slate-400">
          <tr>
            <th className="px-3 py-2 text-left">Test</th>
            <th className="px-3 py-2 text-left">Result</th>
            <th className="px-3 py-2 text-left">Reference</th>
          </tr>
        </thead>
        <tbody>
          {labs.map((lab) => (
            <tr key={lab.id} className="border-t border-slate-800">
              <td className="px-3 py-2">{lab.name}</td>
              <td className={`px-3 py-2 ${lab.flag === "high" ? "text-amber-300" : lab.flag === "low" ? "text-sky-300" : ""}`}>
                {lab.value} {lab.unit}
              </td>
              <td className="px-3 py-2 text-slate-400">{lab.reference}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderTestsPanel({ tests }: { tests: ClinicalCase["orderableTests"] }) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
      <h4 className="text-sm font-semibold text-white">Order tests</h4>
      <p className="mt-1 text-xs text-slate-400">Cost/time realism nudges stewardship.</p>
      <div className="mt-3 space-y-3">
        {tests.map((test) => (
          <div key={test.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white">{test.name}</p>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{test.cost.toUpperCase()}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{test.rationale}</p>
            <div className="mt-2 flex gap-3 text-xs text-slate-400">
              <span>{test.durationMinutes} min</span>
              <span>Yield {test.yieldScore}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HintsList({ caseData, consumeHint }: { caseData: ClinicalCase; consumeHint: (id: string) => void }) {
  const [openHintId, setOpenHintId] = useState<string | null>(null);
  return (
    <div className="flex gap-2">
      {caseData.hints.map((hint) => {
        const open = openHintId === hint.id;
        return (
          <div key={hint.id} className="relative">
            <button
              onClick={() => {
                consumeHint(hint.id);
                setOpenHintId(open ? null : hint.id);
              }}
              className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              {hint.tier} hint
            </button>
            {open && (
              <div className="absolute left-0 top-10 w-56 rounded-2xl border border-slate-800 bg-slate-900/90 p-3 text-xs text-slate-200 shadow-lg">
                <p className="font-semibold text-white">{hint.title}</p>
                <p className="mt-1 text-slate-300">{hint.description}</p>
                <p className="mt-2 text-slate-500">Costs {Math.round(hint.masteryCost * 100)}% mastery for this case.</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderHighlights(text: string, highlights?: string[]) {
  if (!highlights?.length) return text;
  let output = text;
  highlights.forEach((phrase) => {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    output = output.replace(regex, (match) => `<mark class="rounded px-1 bg-indigo-500/30 text-white">${match}</mark>`);
  });
  return <span dangerouslySetInnerHTML={{ __html: output }} />;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
