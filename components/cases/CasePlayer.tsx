"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCaseEngine } from "@/lib/cases/engine";
import type { CaseEngineStep, CaseEngineState } from "@/lib/cases/engine";
import type { CaseStage, CaseStageOption, CaseSummary } from "@/lib/cases/types";
import { usePractice } from "./PracticeProvider";

const STAGE_TYPE_META: Record<CaseStage["stageType"], { label: string; helper: string; accent: string }> = {
  info: { label: "Intel drop", helper: "Absorb the scene", accent: "text-indigo-200" },
  decision: { label: "Decision node", helper: "Commit to the best next step", accent: "text-emerald-200" },
  order: { label: "Ordering bay", helper: "Pick the highest-yield test", accent: "text-sky-200" },
  diagnosis: { label: "Hypothesis lock", helper: "Synthesize the evidence", accent: "text-amber-200" },
  management: { label: "Management cascade", helper: "Escalate care deliberately", accent: "text-orange-200" },
  summary: { label: "Debrief", helper: "Reflect and bank lessons", accent: "text-fuchsia-200" },
};

const DIAGNOSIS_THEME = {
  headerGradient: "from-sky-600/40 via-slate-900 to-slate-950",
  chip: "border-sky-500/40 bg-sky-500/10 text-sky-100",
  optionIdle: "border-slate-800 bg-slate-900/60 hover:border-slate-600",
  optionActive: "border-sky-500/70 bg-sky-500/15 text-white",
  optionSelected: "border-sky-400/80 bg-sky-500/10 text-sky-50",
  timelineActive: "border-sky-500/60 bg-sky-500/10",
  timelineVisited: "border-slate-700 bg-slate-900/60",
  statAccent: "text-sky-200",
};

const MANAGEMENT_THEME = {
  headerGradient: "from-amber-600/40 via-slate-900 to-slate-950",
  chip: "border-amber-500/50 bg-amber-500/10 text-amber-100",
  optionIdle: "border-slate-800 bg-slate-900/60 hover:border-slate-600",
  optionActive: "border-amber-500/80 bg-amber-500/15 text-white",
  optionSelected: "border-amber-400/80 bg-amber-500/10 text-amber-50",
  timelineActive: "border-amber-500/60 bg-amber-500/10",
  timelineVisited: "border-slate-700 bg-slate-900/60",
  statAccent: "text-amber-200",
};

const HOTKEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

type TimelineGroup = { phase: number; stages: CaseStage[] };
type TimelineMap = Record<string, CaseEngineStep[]>;
type Achievement = { id: string; title: string; detail: string; status: "earned" | "in_progress" };

export default function CasePlayer({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { bundle } = usePractice();
  const baseHref = useMemo(() => `/cases/${bundle.collection.slug}`, [bundle.collection.slug]);
  const caseSummary = useMemo(
    () => bundle.cases.find((item) => item.id === caseId || item.slug === caseId),
    [bundle.cases, caseId]
  );

  const engine = useCaseEngine(caseSummary);
  const { state, currentStage, selectOption, reset } = engine;
  const theme = themeForPhase(state.phase);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!currentStage || currentStage.options.length === 0) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (HOTKEYS.includes(event.key)) {
        const index = Number(event.key) - 1;
        const option = currentStage.options[index];
        if (option) {
          event.preventDefault();
          selectOption(option.value, currentStage.slug);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentStage, selectOption]);

  if (!caseSummary) {
    return (
      <div className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-10 text-center text-slate-200">
        <p>Case not found.</p>
        <div className="mt-4 flex justify-center gap-3 text-sm">
          <button onClick={() => router.back()} className="rounded-full border border-slate-700 px-4 py-2 text-slate-300 hover:border-slate-500">
            Go back
          </button>
          <Link href={baseHref} className="rounded-full bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-400">
            Return to library
          </Link>
        </div>
      </div>
    );
  }

  if (state.status === "unsupported") {
    return (
      <div className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-10 text-center text-slate-200">
        <h2 className="text-xl font-semibold text-white">This case needs a graph upgrade</h2>
        <p className="mt-3 text-sm text-slate-300">
          We are migrating all cases to the new saga engine. This one still uses the legacy single-step format.
        </p>
        <Link href={baseHref} className="mt-6 inline-flex items-center rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
          Choose another case
        </Link>
      </div>
    );
  }

  const groupedStages = useMemo(() => groupStages(state.orderedStageSlugs, state.stageMap), [state.orderedStageSlugs, state.stageMap]);
  const timelineByStage = useMemo(() => buildTimelineMap(state.timeline), [state.timeline]);
  const selectedForStage = currentStage ? state.selectedOptions[currentStage.slug] ?? [] : [];
  const estimatedMinutes = caseSummary.estimatedMinutes ?? 20;
  const progressPercent = Math.round((state.visitedStageSlugs.length / Math.max(1, state.orderedStageSlugs.length)) * 100);
  const achievements = useMemo(() => buildAchievements(state, caseSummary, progressPercent), [state, caseSummary, progressPercent]);
  const lastMove = state.lastStep;

  return (
    <div className="space-y-6">
      <header
        className={`relative overflow-hidden rounded-3xl border border-slate-800/60 bg-gradient-to-r ${theme.headerGradient} p-6 shadow-2xl shadow-indigo-950/30`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.15),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(56,189,248,0.15),transparent_55%)]" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${theme.chip}`}>
              {state.phase <= 1 ? "Phase 1 - Diagnosis hunt" : "Phase 2 - Management cascade"}
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl lg:text-5xl">{caseSummary.title}</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">{caseSummary.overview ?? caseSummary.subtitle ?? "Reason through the scenario step by step."}</p>
          </div>
          <div className="flex flex-wrap items-end gap-4 text-sm text-slate-100">
            <EnergyMeter energy={state.masteryEnergy} comboLevel={state.comboLevel} />
            <StatCard label="Time budget" value={`${state.timeSpent} / ${estimatedMinutes} min`} accent={theme.statAccent} helper="Stewardship rewards efficiency." />
            <StatCard label="Score" value={`${state.score > 0 ? "+" : ""}${state.score}`} accent={theme.statAccent} helper="Points swing with each move." />
            <StatCard label="Actions" value={`${state.totalActions}`} accent={theme.statAccent} helper={`${state.mistakes} missteps - streak ${state.streak}`} />
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[260px,1fr,320px]">
        <TimelineColumn
          groups={groupedStages}
          theme={theme}
          currentStageSlug={state.currentStageSlug}
          visited={new Set(state.visitedStageSlugs)}
          timelineMap={timelineByStage}
        />

        <StagePanel
          theme={theme}
          caseSummary={caseSummary}
          stage={currentStage}
          stateStatus={state.status}
          selected={selectedForStage}
          onSelect={(option) => selectOption(option.value, currentStage?.slug)}
          lastMove={lastMove}
          onReset={reset}
          baseHref={baseHref}
          progressPercent={progressPercent}
          comboLevel={state.comboLevel}
        />

        <InsightsRail
          theme={theme}
          caseSummary={caseSummary}
          engineState={state}
          timelineByStage={timelineByStage}
          progressPercent={progressPercent}
          achievements={achievements}
        />
      </div>
    </div>
  );
}

function themeForPhase(phase: number) {
  return phase > 1 ? MANAGEMENT_THEME : DIAGNOSIS_THEME;
}

function groupStages(orderedSlugs: string[], stageMap: Record<string, CaseStage>): TimelineGroup[] {
  const groups = new Map<number, CaseStage[]>();
  for (const slug of orderedSlugs) {
    const stage = stageMap[slug];
    if (!stage) continue;
    if (!groups.has(stage.phase)) groups.set(stage.phase, []);
    groups.get(stage.phase)!.push(stage);
  }
  return Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([phase, stages]) => ({ phase, stages }));
}

function buildTimelineMap(timeline: CaseEngineStep[]): TimelineMap {
  return timeline.reduce<TimelineMap>((acc, step) => {
    if (!acc[step.stageSlug]) acc[step.stageSlug] = [];
    acc[step.stageSlug].push(step);
    return acc;
  }, {});
}

function TimelineColumn({
  groups,
  currentStageSlug,
  visited,
  timelineMap,
  theme,
}: {
  groups: TimelineGroup[];
  currentStageSlug: string | null;
  visited: Set<string>;
  timelineMap: TimelineMap;
  theme: typeof DIAGNOSIS_THEME;
}) {
  return (
    <aside className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5 text-sm text-slate-200 shadow-xl shadow-indigo-950/10">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Saga map</p>
      <div className="mt-4 space-y-5">
        {groups.map((group) => (
          <section key={group.phase}>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Phase {group.phase} - {group.phase === 1 ? "Find the diagnosis" : "Management cascade"}
            </p>
            <div className="mt-2 space-y-3">
              {group.stages.map((stage) => {
                const status = currentStageSlug === stage.slug ? "active" : visited.has(stage.slug) ? "visited" : "pending";
                const stageMeta = STAGE_TYPE_META[stage.stageType];
                const steps = timelineMap[stage.slug] ?? [];
                return (
                  <div
                    key={stage.slug}
                    className={`rounded-2xl border p-3 transition ${
                      status === "active"
                        ? theme.timelineActive
                        : status === "visited"
                          ? theme.timelineVisited
                          : "border-slate-800 bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className={`font-semibold text-white ${stageMeta.accent}`}>{stageMeta.label}</span>
                      <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                        {stage.stageType}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-white">{stage.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{stage.subtitle}</p>
                    {steps.length > 0 && (
                      <ul className="mt-2 space-y-2 text-xs text-slate-300">
                        {steps.map((step) => (
                          <li key={step.id} className="rounded-xl border border-slate-800 bg-slate-900/60 px-2 py-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-slate-100">{step.optionLabel}</span>
                              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                                {step.scoreDelta >= 0 ? `+${step.scoreDelta}` : step.scoreDelta} pts - {step.costTime}m
                              </span>
                            </div>
                            {step.feedback && <p className="mt-0.5 text-[11px] text-slate-400">{step.feedback}</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}

function StagePanel({
  theme,
  caseSummary,
  stage,
  stateStatus,
  selected,
  onSelect,
  lastMove,
  onReset,
  baseHref,
  progressPercent,
  comboLevel,
}: {
  theme: typeof DIAGNOSIS_THEME;
  caseSummary: CaseSummary;
  stage?: CaseStage;
  stateStatus: string;
  selected: string[];
  onSelect: (option: CaseStageOption) => void;
  lastMove?: CaseEngineStep;
  onReset: () => void;
  baseHref: string;
  progressPercent: number;
  comboLevel: number;
}) {
  if (!stage) {
    return (
      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-8 text-center text-slate-200 shadow-xl shadow-indigo-950/10">
        <p>{stateStatus === "completed" ? "Saga complete!" : "Loading stage..."}</p>
      </div>
    );
  }

  const stageMeta = STAGE_TYPE_META[stage.stageType];
  const options = stage.options ?? [];

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 shadow-xl shadow-indigo-950/10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={`text-xs uppercase tracking-[0.3em] ${stageMeta.accent}`}>{stageMeta.label}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{stage.title}</h2>
            {stage.subtitle && <p className="mt-1 text-sm text-slate-300">{stage.subtitle}</p>}
          </div>
          <div className="flex flex-col items-end gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-slate-800 px-3 py-1 uppercase tracking-[0.3em]">Stage {stage.orderIndex + 1}</span>
            <span className="uppercase tracking-[0.3em]">Phase {stage.phase}</span>
            {comboLevel > 0 && (
              <span className="rounded-full border border-emerald-400 px-3 py-1 text-emerald-200">Combo level {comboLevel}</span>
            )}
          </div>
        </header>

        <div className="mt-4">
          <ProgressBar percent={progressPercent} label="Case progress" />
        </div>

        {stage.info.length > 0 && (
          <ul className="mt-4 space-y-2 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 text-sm text-slate-200">
            {stage.info.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-xs uppercase tracking-[0.25em] text-slate-400">{stageMeta.helper}</p>
        <div className="mt-3 space-y-3">
          {options.length === 0 && (
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5 text-sm text-slate-200">
              <p>
                No actions required. {stateStatus === "completed" ? "You can explore the debrief." : "Advance when ready."}
              </p>
            </div>
          )}
          {options.map((option, index) => {
            const isSelected = selected.includes(option.value);
            return (
              <OptionCard
                key={option.value}
                option={option}
                index={index}
                theme={theme}
                disabled={stateStatus === "completed" && !isSelected}
                selected={isSelected}
                onClick={() => onSelect(option)}
                hotkey={HOTKEYS[index]}
              />
            );
          })}
        </div>
      </div>

      <LatestMovePanel lastMove={lastMove} />

      {stateStatus === "completed" && (
        <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-sm text-emerald-100 shadow-lg shadow-emerald-900/30">
          <h3 className="text-lg font-semibold text-emerald-100">Diagnosis unlocked!</h3>
          <p className="mt-2 text-emerald-200/80">
            You completed the reasoning arc. Jump into the debrief or reset to explore alternate paths.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`${baseHref}/debrief/${caseSummary.id}`} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400">
              Open debrief
            </Link>
            <button onClick={onReset} className="rounded-full border border-emerald-500/60 px-4 py-2 text-sm text-emerald-100 hover:border-emerald-400">
              Reset case
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function OptionCard({
  option,
  index,
  theme,
  disabled,
  selected,
  onClick,
  hotkey,
}: {
  option: CaseStageOption;
  index: number;
  theme: typeof DIAGNOSIS_THEME;
  disabled: boolean;
  selected: boolean;
  onClick: () => void;
  hotkey?: string;
}) {
  const cost = option.costTime ?? 0;
  const delta = option.scoreDelta ?? 0;
  return (
    <button
      onClick={onClick}
      disabled={disabled || selected}
      className={`w-full rounded-2xl border p-4 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-400/70 ${
        selected ? theme.optionSelected : theme.optionIdle
      } ${disabled ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
            <span>{hotkey ? `Key ${hotkey}` : `#${index + 1}`}</span>
            {selected && <span className="text-emerald-300">Locked in</span>}
          </div>
          <p className="mt-1 text-base font-semibold text-white">{option.label}</p>
          {option.description && <p className="mt-1 text-sm text-slate-300">{option.description}</p>}
          {option.detail && <p className="mt-2 text-xs text-slate-400">{option.detail}</p>}
        </div>
        <div className="flex flex-col items-end text-xs text-slate-300">
          <span className="rounded-full border border-slate-700 px-2 py-0.5 uppercase tracking-[0.2em]">{cost} min</span>
          <span className={`mt-2 text-sm font-semibold ${delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {delta >= 0 ? "+" : ""}
            {delta} pts
          </span>
        </div>
      </div>
    </button>
  );
}

function LatestMovePanel({ lastMove }: { lastMove?: CaseEngineStep }) {
  if (!lastMove) return null;
  return (
    <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5 text-sm text-slate-200 shadow-xl shadow-indigo-950/10">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Latest move</p>
      <h3 className="mt-2 text-lg font-semibold text-white">{lastMove.optionLabel}</h3>
      {lastMove.feedback && <p className="mt-1 text-sm text-slate-300">{lastMove.feedback}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <span className="rounded-full border border-slate-700 px-2 py-1 text-slate-300">Time {lastMove.costTime} min</span>
        <span className={`rounded-full px-2 py-1 text-white ${lastMove.scoreDelta >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
          {lastMove.scoreDelta >= 0 ? "+" : ""}
          {lastMove.scoreDelta} pts
        </span>
        <span className="rounded-full border border-slate-700 px-2 py-1 text-slate-400">Phase {lastMove.phase}</span>
        <span className={`rounded-full px-2 py-1 text-white ${lastMove.masteryEnergyDelta >= 0 ? "bg-indigo-500/20" : "bg-rose-500/20"}`}>
          Energy {lastMove.masteryEnergyDelta >= 0 ? "+" : ""}
          {Math.round(lastMove.masteryEnergyDelta)}
        </span>
      </div>
      {lastMove.reveals.length > 0 && (
        <ul className="mt-3 space-y-2 text-sm text-slate-200">
          {lastMove.reveals.map((item, idx) => (
            <li key={idx} className="rounded-xl border border-slate-800/60 bg-slate-900/60 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InsightsRail({
  theme,
  caseSummary,
  engineState,
  timelineByStage,
  progressPercent,
  achievements,
}: {
  theme: typeof DIAGNOSIS_THEME;
  caseSummary: CaseSummary;
  engineState: CaseEngineState;
  timelineByStage: TimelineMap;
  progressPercent: number;
  achievements: Achievement[];
}) {
  const progressionLabel = progressPercent >= 100 ? "Case complete" : `${progressPercent}% ready`;

  return (
    <aside className="space-y-4">
      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5 text-sm text-slate-200 shadow-xl shadow-indigo-950/10">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Progression</p>
        <div className="mt-3">
          <ProgressBar percent={progressPercent} label={progressionLabel} />
        </div>
        <div className="mt-4 grid gap-2 text-xs text-slate-400">
          <span>Mastery energy {Math.round(engineState.masteryEnergy)} / 150</span>
          <span>Combo streak {engineState.streak}</span>
          <span>Scenes visited {engineState.visitedStageSlugs.length} / {engineState.orderedStageSlugs.length}</span>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5 text-sm text-slate-200 shadow-xl shadow-indigo-950/10">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Hypothesis board</p>
        {engineState.hypotheses.length === 0 ? (
          <p className="mt-3 text-xs text-slate-400">Hypotheses will surface as you gather evidence.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {engineState.hypotheses.map((hypothesis) => (
              <li key={hypothesis} className="rounded-2xl border border-slate-800/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-100">
                {hypothesis}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5 text-sm text-slate-200 shadow-xl shadow-indigo-950/10">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Evidence log</p>
        {engineState.evidence.length === 0 ? (
          <p className="mt-3 text-xs text-slate-400">Key findings populate here as you unlock scenes.</p>
        ) : (
          <ul className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1 text-sm">
            {engineState.evidence.map((item, idx) => (
              <li key={idx} className="rounded-xl border border-slate-800/60 bg-slate-900/60 px-3 py-2 text-slate-100">
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5 text-sm text-slate-200 shadow-xl shadow-indigo-950/10">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Resource telemetry</p>
        <div className="mt-4 space-y-3 text-xs">
          <ResourceRow label="Minutes spent" value={`${engineState.timeSpent} / ${caseSummary.estimatedMinutes ?? 20}`} theme={theme} />
          <ResourceRow label="Actions taken" value={`${engineState.totalActions}`} theme={theme} />
          <ResourceRow label="Mistakes" value={`${engineState.mistakes}`} theme={theme} />
          <ResourceRow label="Combo level" value={`${engineState.comboLevel}`} theme={theme} />
        </div>
      </div>

      <AchievementsList achievements={achievements} />
    </aside>
  );
}

function ResourceRow({ label, value, theme }: { label: string; value: string; theme: typeof DIAGNOSIS_THEME }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/50 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${theme.statAccent}`}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, helper, accent }: { label: string; value: string; helper: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${accent}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </div>
  );
}

function EnergyMeter({ energy, comboLevel }: { energy: number; comboLevel: number }) {
  const percent = Math.round((energy / 150) * 100);
  const cappedPercent = Math.min(100, Math.max(0, percent));
  return (
    <div className="flex min-w-[180px] flex-col gap-2 rounded-2xl border border-indigo-500/40 bg-slate-900/60 p-4 text-xs text-slate-200">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em]">
        <span className="text-indigo-200">Mastery energy</span>
        <span>{Math.round(energy)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400" style={{ width: `${cappedPercent}%` }} />
      </div>
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em]">
        <span className="text-slate-400">Combo</span>
        <span>{comboLevel}</span>
      </div>
    </div>
  );
}

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  const value = Math.min(100, Math.max(0, percent));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-500 to-indigo-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function AchievementsList({ achievements }: { achievements: Achievement[] }) {
  if (achievements.length === 0) return null;
  return (
    <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5 text-sm text-slate-200 shadow-xl shadow-indigo-950/10">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Achievements</p>
      <ul className="mt-4 space-y-3">
        {achievements.map((achievement) => (
          <li
            key={achievement.id}
            className={`rounded-2xl border px-3 py-2 text-xs ${
              achievement.status === "earned"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                : "border-slate-800 bg-slate-900/60 text-slate-300"
            }`}
          >
            <p className="font-semibold text-white">{achievement.title}</p>
            <p className="mt-1 text-[11px] text-current">{achievement.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function buildAchievements(state: CaseEngineState, summary: CaseSummary, progressPercent: number): Achievement[] {
  const achievements: Achievement[] = [];
  const targetMinutes = summary.estimatedMinutes ?? 20;

  achievements.push({
    id: "diagnostic-combo",
    title: "Diagnostic combo",
    detail: state.streak >= 3 ? "Maintained a triple-streak of correct moves." : "Chain 3 correct decisions in a row.",
    status: state.streak >= 3 ? "earned" : "in_progress",
  });

  achievements.push({
    id: "stewardship",
    title: "Stewardship star",
    detail: state.timeSpent <= targetMinutes ? `Stayed within the ${targetMinutes} minute budget.` : `Finish under ${targetMinutes} minutes to earn.`,
    status: state.timeSpent <= targetMinutes ? "earned" : "in_progress",
  });

  achievements.push({
    id: "investigation",
    title: "Investigation complete",
    detail: progressPercent >= 75 ? "Unlocked the critical scenes leading to the diagnosis." : "Unlock 75% of scenes to claim.",
    status: progressPercent >= 75 ? "earned" : "in_progress",
  });

  achievements.push({
    id: "bias-aware",
    title: "Bias aware",
    detail: state.mistakes <= 1 ? "Kept missteps to a minimum." : "Finish with 1 or fewer missteps to earn.",
    status: state.mistakes <= 1 ? "earned" : "in_progress",
  });

  return achievements;
}

