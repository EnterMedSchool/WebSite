"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePractice, type SessionAids, type SessionDraft, type SessionFilters } from "./PracticeProvider";
import type { PracticeMode, CaseSummary } from "@/lib/cases/types";

const PRESET_STORAGE_KEY = "cases:session-presets";

const MODE_OPTIONS: Array<{ value: PracticeMode; label: string; helper: string }> = [
  { value: "study", label: "Study", helper: "Tutor aids available" },
  { value: "exam", label: "Exam", helper: "Strict timing, no aides" },
  { value: "adaptive", label: "Adaptive", helper: "Auto difficulty & pacing" },
  { value: "rapid", label: "Rapid", helper: "Short, high-energy reps" },
];

const TIME_CHOICES = [20, 30, 40, 50, 60];

const AID_LABELS: Record<keyof SessionAids, { label: string; helper: string }> = {
  hints: { label: "Tutor hints", helper: "Inline coaching + commentary" },
  ruleOut: { label: "Rule-out tracker", helper: "Track differentials as you go" },
  labRef: { label: "Lab reference", helper: "Quick-access normal ranges" },
  calculator: { label: "Calculator", helper: "Bedside calculations" },
};

type RankedCase = { caseSummary: CaseSummary; score: number };

type SessionPreset = {
  id: string;
  name: string;
  savedAt: string;
  draft: SessionDraft;
};

export default function SessionBuilder() {
  const router = useRouter();
  const { bundle, state, setMode, startSession } = usePractice();
  const baseHref = useMemo(() => `/cases/${bundle.collection.slug}`, [bundle.collection.slug]);
  const cases = bundle.cases;

  const systems = useMemo(() => uniqueValues(cases.map((c) => c.system).filter(isTruthy)), [cases]);
  const disciplines = useMemo(() => uniqueValues(cases.map((c) => c.discipline).filter(isTruthy)), [cases]);
  const availableTasks = useMemo(
    () => uniqueValues(cases.flatMap((c) => c.physicianTasks ?? []).filter(isTruthy)),
    [cases]
  );
  const availableSkills = useMemo(
    () => uniqueValues(cases.flatMap((c) => c.skills ?? []).filter(isTruthy)),
    [cases]
  );
  const difficultyOptions = useMemo(() => uniqueValues(cases.map((c) => c.difficulty)), [cases]);

  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [length, setLength] = useState<number>(() => (cases.length ? Math.min(10, cases.length) : 0));
  const [timeBox, setTimeBox] = useState<number | null>(null);
  const [aids, setAids] = useState<SessionAids>({
    hints: state.mode !== "exam",
    ruleOut: true,
    labRef: true,
    calculator: true,
  });
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const filters: SessionFilters = useMemo(
    () => ({
      systems: selectedSystems,
      disciplines: selectedDisciplines,
      tasks: selectedTasks,
      skills: selectedSkills,
      difficulty: selectedDifficulty,
    }),
    [selectedSystems, selectedDisciplines, selectedTasks, selectedSkills, selectedDifficulty]
  );

  const rankedCases = useMemo(() => rankCases(cases, filters), [cases, filters]);
  const matchedCases = useMemo(() => rankedCases.map((item) => item.caseSummary), [rankedCases]);

  useEffect(() => {
    if (matchedCases.length === 0) {
      if (length !== 0) {
        setLength(0);
      }
      return;
    }
    if (length === 0) {
      setLength(Math.min(10, matchedCases.length));
      return;
    }
    if (length > matchedCases.length) {
      setLength(matchedCases.length);
    }
  }, [matchedCases.length, length]);

  const plannedCases = useMemo(() => matchedCases.slice(0, length || 0), [matchedCases, length]);
  const plannedCaseSlugs = useMemo(() => plannedCases.map((c) => c.slug), [plannedCases]);
  const projectedMinutes = useMemo(() => {
    if (timeBox) return timeBox;
    return plannedCases.reduce((sum, item) => sum + (item.estimatedMinutes ?? 3), 0);
  }, [plannedCases, timeBox]);

  const sessionTitle = useMemo(() => buildSessionTitle(filters, plannedCaseSlugs.length), [filters, plannedCaseSlugs.length]);

  const toggleListValue = useCallback((value: string, list: string[], setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }, []);

  const toggleAid = useCallback((key: keyof SessionAids) => {
    setAids((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSavePreset = useCallback(() => {
    if (typeof window === "undefined" || !plannedCaseSlugs.length) return;
    const draft: SessionDraft = {
      title: sessionTitle,
      mode: state.mode,
      caseSlugs: plannedCaseSlugs,
      timeBox,
      aids,
      filters,
    };
    const preset: SessionPreset = {
      id: `preset-${Date.now().toString(36)}`,
      name: sessionTitle,
      savedAt: new Date().toISOString(),
      draft,
    };
    try {
      const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
      const existing: SessionPreset[] = raw ? JSON.parse(raw) : [];
      const updated = [preset, ...existing.filter((item) => item.name !== preset.name)].slice(0, 10);
      window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(updated));
      setSaveFeedback("Preset saved locally");
      window.setTimeout(() => setSaveFeedback(null), 2400);
    } catch (error) {
      console.error("Failed to save preset", error);
      setSaveFeedback("Unable to save preset in this browser");
      window.setTimeout(() => setSaveFeedback(null), 2400);
    }
  }, [plannedCaseSlugs, sessionTitle, state.mode, timeBox, aids, filters]);

  const handleStartSession = useCallback(() => {
    if (!plannedCaseSlugs.length) return;
    const draft: SessionDraft = {
      title: sessionTitle,
      mode: state.mode,
      caseSlugs: plannedCaseSlugs,
      timeBox,
      aids,
      filters,
    };
    startSession(draft);
    router.push(`${baseHref}/practice/${plannedCaseSlugs[0]}`);
  }, [plannedCaseSlugs, sessionTitle, state.mode, timeBox, aids, filters, startSession, router, baseHref]);

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-white">Build a session</h2>
        <p className="mt-2 text-sm text-slate-300">
          Filters run entirely client-side, so you can experiment without extra API calls. Dial in your focus, then launch when the mix feels right.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <FilterGroup title="Systems" options={systems} selected={selectedSystems} onToggle={(value) => toggleListValue(value, selectedSystems, setSelectedSystems)} />
          <FilterGroup title="Disciplines" options={disciplines} selected={selectedDisciplines} onToggle={(value) => toggleListValue(value, selectedDisciplines, setSelectedDisciplines)} />
          <FilterGroup title="Physician tasks" options={availableTasks} selected={selectedTasks} onToggle={(value) => toggleListValue(value, selectedTasks, setSelectedTasks)} />
          <FilterGroup title="Skills" options={availableSkills} selected={selectedSkills} onToggle={(value) => toggleListValue(value, selectedSkills, setSelectedSkills)} />
        </div>

        <FilterGroup
          title="Difficulty"
          options={difficultyOptions}
          selected={selectedDifficulty}
          onToggle={(value) => toggleListValue(value, selectedDifficulty, setSelectedDifficulty)}
          className="mt-6"
        />

        <ConfigurationPanel
          currentMode={state.mode}
          onModeChange={setMode}
          length={plannedCases.length ? length : 0}
          onLengthChange={setLength}
          maxLength={matchedCases.length}
          timeBox={timeBox}
          onTimeBoxChange={setTimeBox}
          aids={aids}
          onToggleAid={toggleAid}
        />

        <PlannedCasesList plannedCases={plannedCases} matchedCount={matchedCases.length} baseHref={baseHref} />
      </section>

      <aside className="flex flex-col gap-6">
        <div className="rounded-3xl border border-indigo-500/30 bg-indigo-950/30 p-6 text-sm text-indigo-100">
          <h3 className="text-lg font-semibold text-white">Session preview</h3>
          <ul className="mt-3 space-y-2">
            <li>- {plannedCaseSlugs.length || 0} case{plannedCaseSlugs.length === 1 ? "" : "s"} queued</li>
            <li>- {projectedMinutes} minute{projectedMinutes === 1 ? "" : "s"} {timeBox ? "time-box" : "estimated"}</li>
            <li>- Mode: {state.mode.toUpperCase()}</li>
          </ul>
          {saveFeedback && <p className="mt-3 text-xs text-indigo-200/80">{saveFeedback}</p>}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSavePreset}
              disabled={!plannedCaseSlugs.length}
              className="flex-1 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save as preset
            </button>
            <button
              onClick={handleStartSession}
              disabled={!plannedCaseSlugs.length}
              className="flex-1 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              Start session
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-200">
          <h3 className="text-lg font-semibold text-white">Blueprint coverage</h3>
          <p className="mt-2 text-xs text-slate-400">We balance your filters with case availability locally before any session starts.</p>
          <ul className="mt-4 space-y-2">
            {plannedCases.slice(0, 4).map((c) => (
              <li key={c.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-sm font-semibold text-white">{c.title}</p>
                <p className="text-xs text-slate-400">{c.system ?? "Multi-system"} | {c.discipline ?? "Clinical reasoning"} | {c.difficulty}</p>
              </li>
            ))}
            {plannedCases.length === 0 && <li className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">No cases match the current filters.</li>}
          </ul>
          <Link href={`${baseHref}/cases`} className="mt-4 inline-flex text-xs font-semibold text-indigo-300 hover:text-white">
            Browse full library {"->"}
          </Link>
        </div>
      </aside>

      <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-300">
        <h3 className="text-lg font-semibold text-white">Session summary</h3>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <SummaryCard title="Mode" value={state.mode.toUpperCase()} description="Study -> coaching, Exam -> strict, Adaptive -> auto difficulty, Rapid -> fast drills." />
          <SummaryCard
            title="Length"
            value={`${plannedCaseSlugs.length} case${plannedCaseSlugs.length === 1 ? "" : "s"}`}
            description={matchedCases.length ? `${matchedCases.length} matches available for these filters.` : "Adjust filters to surface cases."}
          />
          <SummaryCard
            title="Time budget"
            value={timeBox ? `${timeBox} min` : `${projectedMinutes} min est.`}
            description={timeBox ? "Hard cap for the run." : "Estimated from case timings."}
          />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Focus"
            value={filters.systems.length ? filters.systems.join(", ") : "Mixed systems"}
            description={filters.disciplines.length ? filters.disciplines.join(", ") : "All disciplines"}
          />
          <SummaryCard
            title="Tasks"
            value={filters.tasks.length ? filters.tasks.join(", ") : "Blend"}
            description={filters.skills.length ? `Skills: ${filters.skills.join(", ")}` : "All skill categories"}
          />
          <SummaryCard
            title="Aids"
            value={Object.entries(aids)
              .filter(([, active]) => active)
              .map(([key]) => AID_LABELS[key as keyof SessionAids].label)
              .join(", ") || "Minimal"}
            description="Toggle aids to control scaffolding." />
        </div>
      </div>
    </div>
  );
}

function ConfigurationPanel({
  currentMode,
  onModeChange,
  length,
  onLengthChange,
  maxLength,
  timeBox,
  onTimeBoxChange,
  aids,
  onToggleAid,
}: {
  currentMode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  length: number;
  onLengthChange: (next: number) => void;
  maxLength: number;
  timeBox: number | null;
  onTimeBoxChange: (value: number | null) => void;
  aids: SessionAids;
  onToggleAid: (key: keyof SessionAids) => void;
}) {
  const safeMax = Math.max(1, maxLength);
  const sliderValue = Math.min(length || 1, safeMax);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-semibold text-white">Mode</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {MODE_OPTIONS.map((option) => {
            const active = option.value === currentMode;
            return (
              <button
                key={option.value}
                onClick={() => onModeChange(option.value)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  active ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {MODE_OPTIONS.find((opt) => opt.value === currentMode)?.helper ?? "Pick the constraint that matches today's goal."}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-semibold text-white">Length</h3>
        <p className="text-xs text-slate-400">Target between 5-20 cases for focused reps.</p>
        <input
          type="range"
          min={1}
          max={safeMax}
          value={sliderValue}
          disabled={!maxLength}
          onChange={(event) => onLengthChange(Math.min(Number(event.target.value), safeMax))}
          className="mt-4 w-full"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>{maxLength ? `${sliderValue} case${sliderValue === 1 ? "" : "s"}` : "No matches yet"}</span>
          <button
            onClick={() => onLengthChange(Math.min(safeMax, sliderValue + 1))}
            disabled={!maxLength}
            className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] uppercase tracking-[0.3em] text-slate-300 disabled:opacity-40"
          >
            +1
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-semibold text-white">Time box</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {TIME_CHOICES.map((choice) => {
            const active = timeBox === choice;
            return (
              <button
                key={choice}
                onClick={() => onTimeBoxChange(choice)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  active ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
              >
                {choice} min
              </button>
            );
          })}
          <button
            onClick={() => onTimeBoxChange(null)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              timeBox === null ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            No limit
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="text-sm font-semibold text-white">Session aids</h3>
        <div className="mt-4 space-y-3 text-sm text-slate-200">
          {(Object.keys(AID_LABELS) as Array<keyof SessionAids>).map((key) => {
            const active = aids[key];
            const meta = AID_LABELS[key];
            return (
              <button
                key={key}
                onClick={() => onToggleAid(key)}
                className={`flex w-full flex-col rounded-2xl border px-3 py-2 text-left transition ${
                  active ? "border-emerald-400 bg-emerald-500/10 text-emerald-100" : "border-slate-800 bg-slate-900/60 text-slate-200 hover:border-indigo-400"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.25em]">{meta.label}</span>
                <span className="mt-1 text-[11px] text-current/80">{meta.helper}</span>
              </button>
            );
          })}
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
  className = "",
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {options.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">No metadata available yet.</p>
      ) : (
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
      )}
    </div>
  );
}

function PlannedCasesList({ plannedCases, matchedCount, baseHref }: { plannedCases: CaseSummary[]; matchedCount: number; baseHref: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-200">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Plan preview</span>
        <span>{matchedCount} match{matchedCount === 1 ? "" : "es"}</span>
      </div>
      {plannedCases.length === 0 ? (
        <p className="mt-3 text-xs text-slate-400">Adjust filters to surface cases for this session.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {plannedCases.map((c, index) => (
            <li key={c.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-indigo-300">
                <span>#{index + 1}</span>
                <span>{c.difficulty}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-white">{c.title}</p>
              <p className="mt-1 text-xs text-slate-400">{c.system ?? "Multi-system"} | {c.discipline ?? "Clinical reasoning"} | {c.estimatedMinutes ?? 3} min</p>
              <Link href={`${baseHref}/practice/${c.slug}`} className="mt-2 inline-flex text-xs font-semibold text-indigo-300 hover:text-white">
                Preview case {"->"}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SummaryCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200 shadow-lg shadow-indigo-950/10">
      <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{title}</span>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function rankCases(cases: CaseSummary[], filters: SessionFilters): RankedCase[] {
  const systemSet = new Set(filters.systems);
  const disciplineSet = new Set(filters.disciplines);
  const difficultySet = new Set(filters.difficulty);
  const taskSet = new Set(filters.tasks);
  const skillSet = new Set(filters.skills);

  const ranked: RankedCase[] = [];

  for (const caseSummary of cases) {
    if (systemSet.size && (!caseSummary.system || !systemSet.has(caseSummary.system))) continue;
    if (disciplineSet.size && (!caseSummary.discipline || !disciplineSet.has(caseSummary.discipline))) continue;
    if (difficultySet.size && !difficultySet.has(caseSummary.difficulty)) continue;

    const tasks = caseSummary.physicianTasks ?? [];
    if (taskSet.size && !tasks.some((task) => taskSet.has(task))) continue;

    const skills = caseSummary.skills ?? [];
    if (skillSet.size && !skills.some((skill) => skillSet.has(skill))) continue;

    let score = 1;
    if (systemSet.size) score += 4;
    if (disciplineSet.size) score += 3;
    if (difficultySet.size) score += 2;
    if (taskSet.size) {
      score += tasks.filter((task) => taskSet.has(task)).length * 1.5;
    }
    if (skillSet.size) {
      score += skills.filter((skill) => skillSet.has(skill)).length;
    }
    score += Math.max(0, 3 - (caseSummary.estimatedMinutes ?? 3)) * 0.25;

    ranked.push({ caseSummary, score });
  }

  return ranked.sort((a, b) => b.score - a.score || (a.caseSummary.estimatedMinutes ?? 0) - (b.caseSummary.estimatedMinutes ?? 0));
}

function buildSessionTitle(filters: SessionFilters, length: number) {
  if (length === 0) return "Custom session";
  const parts: string[] = [];
  if (filters.systems.length) parts.push(filters.systems.slice(0, 2).join(", "));
  if (!parts.length && filters.disciplines.length) parts.push(filters.disciplines.slice(0, 2).join(", "));
  if (!parts.length && filters.tasks.length) parts.push(filters.tasks.slice(0, 2).join(", "));
  const base = parts.length ? parts.join(" - ") : "Custom session";
  return `${base} (${length} case${length === 1 ? "" : "s"})`;
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function isTruthy<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined && value !== "";
}
