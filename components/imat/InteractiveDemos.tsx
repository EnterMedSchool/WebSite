"use client";

import { useMemo, useState } from "react";

export function DifficultyKnob() {
  const [level, setLevel] = useState<number>(2);
  const labels = ["Beginner", "Comfortable", "Confident", "Advanced", "Expert"];
  const tips = [
    "We’ll start from first principles.",
    "Speed up with pattern spotting.",
    "Master timing under pressure.",
    "Exploit test quirks consistently.",
    "Hunt edge-cases like a pro.",
  ];
  return (
    <div className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-800">Difficulty</div>
        <div className="text-xs font-bold text-indigo-700">{labels[level]}</div>
      </div>
      <input
        aria-label="Difficulty"
        type="range"
        min={0}
        max={4}
        value={level}
        onChange={(e) => setLevel(parseInt(e.target.value))}
        className="mt-3 w-full accent-indigo-600"
      />
      <div className="mt-3 grid grid-cols-5 gap-2">
        {labels.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full ${i <= level ? "bg-gradient-to-r from-indigo-500 to-sky-400" : "bg-slate-200"}`}
          />
        ))}
      </div>
      <div className="mt-3 rounded-lg bg-indigo-50 p-3 text-xs font-semibold text-indigo-800 ring-1 ring-indigo-200">
        {tips[level]}
      </div>
    </div>
  );
}

export function PlannerDemo() {
  const [week, setWeek] = useState<number>(1);
  const weeks = Array.from({ length: 8 }, (_, i) => i + 1);
  const plan = useMemo(() => {
    // Fake rotating plan bits
    const seeds = [
      ["Critical Thinking Drills", "30m Timed"],
      ["Past Paper Walkthrough", "60m Notes"],
      ["Math Primer", "45m Basics"],
      ["Chemistry Sprint", "30m"],
      ["Biology Recall", "20m"],
      ["Physics Review", "30m"],
    ];
    const roll = (week % seeds.length);
    return [seeds[roll], seeds[(roll + 1) % seeds.length], seeds[(roll + 2) % seeds.length]] as [string, string][];
  }, [week]);
  return (
    <div className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex flex-wrap gap-2">
        {weeks.map((w) => (
          <button
            key={w}
            onClick={() => setWeek(w)}
            className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${
              w === week ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-slate-700 ring-slate-200"
            }`}
            aria-pressed={w === week}
          >
            Week {w}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {plan.map(([name, meta], i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="text-sm font-semibold text-slate-900">{name}</div>
            <div className="text-[11px] font-bold text-slate-600">{meta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuestionLabDemo() {
  const [choice, setChoice] = useState<string>("");
  const correct = "B";
  const isCorrect = choice === correct;
  return (
    <div className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200">
      <div className="text-sm font-semibold text-slate-800">IMAT‑style Quick Check</div>
      <p className="mt-2 text-sm text-slate-700">If x is even and y is odd, which is always odd?</p>
      <div className="mt-2 grid gap-2">
        {["A", "B", "C", "D"].map((opt) => (
          <label key={opt} className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
            <input
              type="radio"
              name="mcq"
              value={opt}
              checked={choice === opt}
              onChange={() => setChoice(opt)}
              className="accent-indigo-600"
            />
            <span className="text-sm font-semibold text-slate-800">{opt}</span>
          </label>
        ))}
      </div>
      {choice && (
        <div
          className={`mt-3 rounded-lg p-3 text-sm font-semibold ${
            isCorrect ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
          }`}
        >
          {isCorrect ? "Correct: even + odd = odd." : "Try again. Hint: even + odd = odd."}
        </div>
      )}
    </div>
  );
}

export function AnalyzerDemo() {
  const [t, setT] = useState<number>(0);
  const cues = [
    { title: "Scan & mark", body: "Tag traps, skip time‑sinks." },
    { title: "Eliminate quickly", body: "Kill 2 options fast." },
    { title: "Compute lightly", body: "Estimate > exact when safe." },
    { title: "Review & lock", body: "Last pass for freebies." },
  ];
  const cue = cues[t];
  return (
    <div className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-800">Past‑paper Analyzer</div>
        <div className="text-xs font-bold text-indigo-700">Step {t + 1}/4</div>
      </div>
      <input
        aria-label="Analyzer step"
        type="range"
        min={0}
        max={3}
        value={t}
        onChange={(e) => setT(parseInt(e.target.value))}
        className="mt-3 w-full accent-indigo-600"
      />
      <div className="mt-3 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
        <div className="text-sm font-extrabold text-slate-900">{cue.title}</div>
        <div className="text-xs font-semibold text-slate-700">{cue.body}</div>
      </div>
    </div>
  );
}

export function PrimerGrid() {
  const topics = ["Ratios", "Logarithms", "Vectors", "Kinematics", "Stoichiometry", "Genetics", "Logic", "Series"];
  const [done, setDone] = useState<Record<string, boolean>>({});
  return (
    <div className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200">
      <div className="text-sm font-semibold text-slate-800">Primer Topics</div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => setDone((d) => ({ ...d, [t]: !d[t] }))}
            className={`rounded-lg px-3 py-2 text-xs font-bold ring-1 transition ${
              done[t]
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                : "bg-slate-50 text-slate-700 ring-slate-200 hover:bg-white"
            }`}
            aria-pressed={!!done[t]}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-3 text-[11px] font-semibold text-slate-600">
        {Object.values(done).filter(Boolean).length} / {topics.length} marked as confident
      </div>
    </div>
  );
}

