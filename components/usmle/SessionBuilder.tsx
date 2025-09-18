"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePractice } from "./PracticeProvider";
import type { PracticeMode } from "@/lib/usmle/types";

const SYSTEMS = ["Endocrine", "Cardiovascular", "Respiratory", "Neurology", "Renal", "Gastrointestinal", "Dermatology"];
const DISCIPLINES = ["Pathology", "Pharmacology", "Physiology", "Microbiology", "Biostatistics"];
const TASKS = ["Diagnosis", "Management", "Interpret Labs", "Order Tests", "Image Reading"];
const SKILLS = ["Algorithm", "EKG", "CT", "Ultrasound", "Derm"];
const DIFFICULTY: Array<{ key: string; label: string }> = [
  { key: "easy", label: "Easy" },
  { key: "moderate", label: "Moderate" },
  { key: "hard", label: "Hard" },
  { key: "experimental", label: "Experimental" },
];
const MODES: PracticeMode[] = ["study", "exam", "adaptive"];
const LENGTHS = [5, 10, 20];
const TIME_BOXES = [20, 30, 40];

export default function SessionBuilder() {
  const { bundle, state, setMode } = usePractice();
  const [selectedSystems, setSelectedSystems] = useState<string[]>(["Endocrine", "Cardiovascular"]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>(["moderate"]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>(["Diagnosis"]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [length, setLength] = useState<number>(10);
  const [timeBox, setTimeBox] = useState<number | null>(40);
  const [adaptiveToggles, setAdaptiveToggles] = useState({
    focusWeakest: true,
    includeUnseen: true,
    blueprintParity: true,
    timePressure: false,
  });
  const [aids, setAids] = useState({ hints: true, ruleOut: true, labRef: true, calculator: true });

  const matchedCases = useMemo(() => {
    return bundle.cases.filter((c) => {
      const systemMatch = selectedSystems.length === 0 || selectedSystems.includes(c.system);
      const diffMatch = selectedDifficulty.length === 0 || selectedDifficulty.includes(c.difficulty);
      const taskMatch = selectedTasks.length === 0 || selectedTasks.some((task) => c.physicianTasks.includes(task));
      const skillMatch = selectedSkills.length === 0 || selectedSkills.some((skill) => c.skills.includes(skill));
      return systemMatch && diffMatch && taskMatch && skillMatch;
    });
  }, [bundle.cases, selectedSystems, selectedDifficulty, selectedTasks, selectedSkills]);

  const toggle = (value: string, list: string[], setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const toggleBoolean = (key: keyof typeof adaptiveToggles) => {
    setAdaptiveToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAid = (key: keyof typeof aids) => {
    setAids((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const projectedDuration = timeBox ?? length * 3;

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-white">Build a session</h2>
        <p className="mt-2 text-sm text-slate-300">
          Filters stay on the client—no requests until you launch. Combine blueprint parity with your personal signal for intelligent sets.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <FilterGroup
            title="Systems"
            options={SYSTEMS}
            selected={selectedSystems}
            onToggle={(value) => toggle(value, selectedSystems, setSelectedSystems)}
          />
          <FilterGroup
            title="Disciplines"
            options={DISCIPLINES}
            selected={selectedDifficulty}
            onToggle={(value) => toggle(value, selectedDifficulty, setSelectedDifficulty)}
          />
          <FilterGroup
            title="Physician tasks"
            options={TASKS}
            selected={selectedTasks}
            onToggle={(value) => toggle(value, selectedTasks, setSelectedTasks)}
          />
          <FilterGroup
            title="Skills"
            options={SKILLS}
            selected={selectedSkills}
            onToggle={(value) => toggle(value, selectedSkills, setSelectedSkills)}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white">Difficulty</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {DIFFICULTY.map((opt) => {
                const active = selectedDifficulty.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    onClick={() => toggle(opt.key, selectedDifficulty, setSelectedDifficulty)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      active ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-sm font-semibold text-white">Smart builder toggles</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <ToggleRow
                label="Focus weakest 3 areas"
                active={adaptiveToggles.focusWeakest}
                onClick={() => toggleBoolean("focusWeakest")}
              />
              <ToggleRow
                label="Include unseens only"
                active={adaptiveToggles.includeUnseen}
                onClick={() => toggleBoolean("includeUnseen")}
              />
              <ToggleRow
                label="NBME blueprint parity"
                active={adaptiveToggles.blueprintParity}
                onClick={() => toggleBoolean("blueprintParity")}
              />
              <ToggleRow
                label="Include time-pressure items"
                active={adaptiveToggles.timePressure}
                onClick={() => toggleBoolean("timePressure")}
              />
            </div>
          </div>
        </div>

        <ConfigurationPanel
          currentMode={state.mode}
          onModeChange={setMode}
          length={length}
          setLength={setLength}
          timeBox={timeBox}
          setTimeBox={setTimeBox}
          aids={aids}
          toggleAid={toggleAid}
        />
      </section>

      <aside className="flex flex-col gap-6">
        <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/30 p-6 text-sm text-indigo-100">
          <h3 className="text-lg font-semibold text-white">Outcome preview</h3>
          <ul className="mt-3 space-y-2">
            <li>• Reasoning map, bias tags, and error fingerprint after each session.</li>
            <li>• Auto flashcard + flowchart seeded for spaced review.</li>
            <li>• {adaptiveToggles.focusWeakest ? "Weakness-first scheduling enabled." : "Manual coverage weighting."}</li>
          </ul>
          <p className="mt-4 text-xs text-indigo-200/70">
            Matched {matchedCases.length} cases locally. Exact mix finalised on start using your latest signals.
          </p>
          <div className="mt-4 flex gap-2">
            <button className="flex-1 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
              Save as preset
            </button>
            <button className="flex-1 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
              Start session
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-200">
          <h3 className="text-lg font-semibold text-white">Blueprint coverage</h3>
          <p className="mt-2 text-xs text-slate-400">Blueprint parity and weakness targeting happen on-device until you launch.</p>
          <ul className="mt-4 space-y-2">
            {matchedCases.slice(0, 4).map((c) => (
              <li key={c.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-sm font-semibold text-white">{c.title}</p>
                <p className="text-xs text-slate-400">{c.system} · {c.discipline} · {c.difficulty}</p>
              </li>
            ))}
          </ul>
          <Link href="/usmle/cases" className="mt-4 inline-flex text-xs font-semibold text-indigo-300 hover:text-white">
            Browse full library →
          </Link>
        </div>
      </aside>

      <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-300">
        <h3 className="text-lg font-semibold text-white">Session summary</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <SummaryCard title="Mode" value={state.mode.toUpperCase()} description="Study → tutor aids, Exam → strict, Adaptive → auto difficulty." />
          <SummaryCard title="Length" value={`${length} items`} description={`Projected ${projectedDuration} min ${timeBox ? "time-boxed" : "estimated"}.`} />
          <SummaryCard title="Filters" value={`${selectedSystems.length} systems • ${selectedDifficulty.length} diffs`} description={`Tasks ${selectedTasks.length}, Skills ${selectedSkills.length}.`} />
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                active ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-left text-sm hover:border-indigo-500/40"
    >
      <span>{label}</span>
      <span
        className={`inline-flex h-5 w-10 items-center rounded-full bg-slate-800 p-0.5 transition ${
          active ? "bg-indigo-500/60" : "bg-slate-700"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition ${active ? "translate-x-5" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}

function ConfigurationPanel({
  currentMode,
  onModeChange,
  length,
  setLength,
  timeBox,
  setTimeBox,
  aids,
  toggleAid,
}: {
  currentMode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  length: number;
  setLength: (len: number) => void;
  timeBox: number | null;
  setTimeBox: (n: number | null) => void;
  aids: { hints: boolean; ruleOut: boolean; labRef: boolean; calculator: boolean };
  toggleAid: (key: keyof typeof aids) => void;
}) {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-semibold text-white">Mode</h3>
        <div className="mt-3 flex gap-2">
          {MODES.map((mode) => {
            const active = currentMode === mode;
            return (
              <button
                key={mode}
                onClick={() => onModeChange(mode)}
                className={`flex-1 rounded-2xl border px-3 py-2 text-sm capitalize transition ${
                  active ? "border-indigo-400 bg-indigo-500/15 text-white" : "border-slate-800 bg-slate-900 text-slate-200"
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Study mode unlocks hints and reasoning aids. Exam mode disables all crutches and mirrors NBME visuals. Adaptive flexes difficulty based on your Elo and blueprint gaps.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-semibold text-white">Length & timing</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {LENGTHS.map((opt) => (
            <button
              key={opt}
              onClick={() => setLength(opt)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                length === opt ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200"
              }`}
            >
              {opt} items
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">Or time-box:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TIME_BOXES.map((opt) => (
            <button
              key={opt}
              onClick={() => setTimeBox(opt)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                timeBox === opt ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200"
              }`}
            >
              {opt} min
            </button>
          ))}
          <button
            onClick={() => setTimeBox(null)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              timeBox === null ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200"
            }`}
          >
            Free pace
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-semibold text-white">Aids (Study mode)</h3>
        <div className="mt-3 space-y-2 text-sm text-slate-200">
          {[
            ["hints", "Hints"],
            ["ruleOut", "Rule-out distractors"],
            ["labRef", "Lab reference"],
            ["calculator", "Calculator"]
          ].map(([key, label]) => (
            <ToggleRow key={key} label={label} active={aids[key as keyof typeof aids]} onClick={() => toggleAid(key as keyof typeof aids)} />
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
        <h3 className="text-sm font-semibold text-white">Mode hints</h3>
        <ul className="mt-3 space-y-2">
          <li>Study → highlight, mini-differential, hints, lab reference available.</li>
          <li>Exam → strict NBME layout, proctor timer, review at end only.</li>
          <li>Adaptive → Elo-like difficulty shifts every case based on confidence + correctness.</li>
        </ul>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
      <h4 className="text-xs uppercase tracking-[0.3em] text-indigo-300">{title}</h4>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}
