"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCaseEngine } from "@/lib/cases/engine";
import type { CaseEngineState, CaseEngineStep } from "@/lib/cases/engine";
import type { CaseStage, CaseStageOption, CaseSummary, CaseStageInteraction, CommentaryTone } from "@/lib/cases/types";
import { usePractice, type ActiveSession } from "./PracticeProvider";

const HOTKEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

type StageStepperItem = {
  slug: string;
  title: string;
  stageType: CaseStage["stageType"];
  phase: number;
  status: "completed" | "current" | "upcoming";
};

type Achievement = {
  id: string;
  title: string;
  detail: string;
  status: "earned" | "in_progress";
};

type AttemptStepPayload = {
  stageId: number;
  stageSlug: string;
  optionId: number;
  optionValue: string;
  correct: boolean;
  costTime: number | null;
  takenAt: number;
};

const STEP_BADGE_META = {
  interaction: { label: "Interaction", className: "bg-indigo-500/15 text-indigo-200" },
  system: { label: "Scene update", className: "bg-sky-500/15 text-sky-200" },
  correct: { label: "Great move", className: "bg-emerald-500/15 text-emerald-200" },
  incorrect: { label: "Outcome", className: "bg-amber-500/15 text-amber-200" },
} as const;

const TONE_META: Record<CommentaryTone, { label: string; helper: string; className: string }> = {
  praise: { label: "Attending fist bump", helper: "Team loves what you just pulled off.", className: "bg-emerald-500/15 text-emerald-200" },
  snark: { label: "Snark mode", helper: "Attending delivers a spicy aside.", className: "bg-fuchsia-500/20 text-fuchsia-200" },
  alert: { label: "Red flag", helper: "This move tripped alarms - tread carefully.", className: "bg-amber-500/20 text-amber-200" },
  serious: { label: "Critical briefing", helper: "Attending gives a sober warning.", className: "bg-sky-500/20 text-sky-200" },
  neutral: { label: "Quick note", helper: "A calm status update from the attending.", className: "bg-slate-700/60 text-slate-200" },
};

export default function CasePlayer({ caseId }: { caseId: string }) {
  const router = useRouter();
  const { bundle, state: practiceState, selectCase: setActiveCase, advanceSession, endSession, setPlanStatus, recordAttempt } = usePractice();
  const baseHref = useMemo(() => `/cases/${bundle.collection.slug}`, [bundle.collection.slug]);
  const caseSummary = useMemo(
    () => bundle.cases.find((item) => item.id === caseId || item.slug === caseId),
    [bundle.cases, caseId]
  );

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const attemptSignatureRef = useRef<string | null>(null);
  const inFlightSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    attemptSignatureRef.current = null;
    inFlightSignatureRef.current = null;
    setSaveStatus("idle");
  }, [caseSummary?.id]);

  useEffect(() => {
    if (caseSummary && practiceState.activeCaseSlug !== caseSummary.slug) {
      setActiveCase(caseSummary.slug);
    }
  }, [caseSummary, practiceState.activeCaseSlug, setActiveCase]);
  const engine = useCaseEngine(caseSummary);
  const { state, currentStage, selectOption, reset, advance, triggerInteraction } = engine;
  const theme = state.phase > 1 ? MANAGEMENT_THEME : DIAGNOSIS_THEME;

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

  useEffect(() => {
    if (!caseSummary || state.status !== "completed" || !caseSummary.graph?.stageMap) {
      return;
    }
    if (!state.timeline.length) {
      return;
    }
    if (saveStatus === "error") {
      return;
    }

    const stageMap = caseSummary.graph.stageMap;
    const optionSteps: AttemptStepPayload[] = state.timeline
      .filter((step) => step.kind === "option" && step.optionValue && stageMap[step.stageSlug])
      .map((step) => {
        const stage = stageMap[step.stageSlug];
        const option = stage?.options.find((candidate) => candidate.value === step.optionValue);
        if (!stage || !option) return null;
        return {
          stageId: stage.id,
          stageSlug: stage.slug,
          optionId: option.id,
          optionValue: option.value,
          correct: Boolean(step.isCorrect),
          costTime: option.costTime ?? null,
          takenAt: step.takenAt ?? Date.now(),
        };
      })
      .filter((item): item is AttemptStepPayload => item !== null);

    if (!optionSteps.length) {
      return;
    }

    const sortedByTime = [...optionSteps].sort((a, b) => a.takenAt - b.takenAt);
    const startedAt = Math.round(sortedByTime[0]?.takenAt ?? Date.now());
    const completedAt = Math.round(sortedByTime[sortedByTime.length - 1]?.takenAt ?? startedAt);
    const signature = `${caseSummary.id}:${state.timeline.length}:${completedAt}`;

    if (attemptSignatureRef.current === signature || inFlightSignatureRef.current === signature) {
      return;
    }

    inFlightSignatureRef.current = signature;

    const totalActions = state.totalActions;
    const correctActions = optionSteps.filter((step) => step.correct).length;
    const incorrectActions = optionSteps.length - correctActions;
    const mistakes = state.mistakes;
    const timeSpentSeconds = Math.max(0, Math.round((completedAt - startedAt) / 1000));

    const payload = {
      caseSlug: caseSummary.slug,
      steps: optionSteps,
      summary: {
        totalActions,
        correctActions,
        incorrectActions,
        score: state.score,
        mistakes,
        phase: state.phase,
        masteryEnergy: state.masteryEnergy,
        comboLevel: state.comboLevel,
        startedAt,
        completedAt,
        timeSpentSeconds,
      },
      evidence: state.evidence ?? [],
    };

    setSaveStatus("saving");
    fetch(`/api/cases/${bundle.collection.slug}/practice/${caseSummary.slug}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to record attempt: ${response.status}`);
        }
        let attemptPayload: any = null;
        try {
          const data = await response.json();
          attemptPayload = data?.attempt ?? null;
        } catch {}

        const startedAtIso =
          typeof attemptPayload?.startedAt === "string"
            ? attemptPayload.startedAt
            : new Date(startedAt).toISOString();
        const completedAtIso =
          typeof attemptPayload?.completedAt === "string"
            ? attemptPayload.completedAt
            : new Date(completedAt).toISOString();

        const attemptRecord = {
          id: Number(attemptPayload?.id ?? Date.now()),
          caseId: caseSummary.dbId,
          caseSlug: caseSummary.slug,
          subjectSlug: caseSummary.subjectSlug,
          subjectName: caseSummary.subjectName,
          collectionSlug: bundle.collection.slug,
          score: Number(attemptPayload?.score ?? state.score),
          totalActions: Number(attemptPayload?.totalActions ?? totalActions),
          correctActions: Number(attemptPayload?.correctActions ?? correctActions),
          incorrectActions: Number(attemptPayload?.incorrectActions ?? incorrectActions),
          mistakes,
          timeSpentSeconds: Number(attemptPayload?.timeSpentSeconds ?? timeSpentSeconds),
          startedAt: startedAtIso,
          completedAt: completedAtIso,
        };

        attemptSignatureRef.current = signature;
        inFlightSignatureRef.current = null;

        recordAttempt(attemptRecord);
        setPlanStatus(caseSummary.slug, "completed");
        setSaveStatus("saved");
      })
      .catch((error) => {
        inFlightSignatureRef.current = null;
        if (attemptSignatureRef.current === signature) {
          attemptSignatureRef.current = null;
        }
        console.error("Failed to sync case attempt", error);
        setSaveStatus("error");
      });
  }, [
    bundle.collection.slug,
    caseSummary,
    recordAttempt,
    saveStatus,
    setPlanStatus,
    state.comboLevel,
    state.evidence,
    state.masteryEnergy,
    state.mistakes,
    state.phase,
    state.score,
    state.status,
    state.timeline,
    state.totalActions,
  ]);

  const orderedStages = useMemo(() => buildStepper(state), [state]);
  const selectedForStage = currentStage ? state.selectedOptions[currentStage.slug] ?? [] : [];
  const totalSteps = state.orderedStageSlugs.length;
  const currentIndex = currentStage ? state.orderedStageSlugs.indexOf(currentStage.slug) : -1;
  const progressPercent = Math.round((state.visitedStageSlugs.length / Math.max(totalSteps, 1)) * 100);
  const achievements = useMemo(() => {
    if (!caseSummary) return [];
    return buildAchievements(state, caseSummary, progressPercent);
  }, [state, caseSummary, progressPercent]);
  const recommendedOption = currentStage?.options.find((option) => option.isCorrect) ?? null;
  const triggeredInteractions = useMemo(() => {
    const set = new Set<string>();
    for (const step of state.timeline) {
      if (step.kind === "interaction" && step.interactionId) {
        set.add(step.interactionId);
      }
    }
    return set;
  }, [state.timeline]);

  const session = practiceState.activeSession;
  const sessionIndex = useMemo(() => {
    if (!session || !caseSummary) return -1;
    return session.caseSlugs.indexOf(caseSummary.slug);
  }, [session, caseSummary]);
  const nextSessionSlug = useMemo(() => {
    if (!session || session.status !== "active" || sessionIndex === -1) return null;
    return session.caseSlugs[sessionIndex + 1] ?? null;
  }, [session, sessionIndex]);
  const handleSessionAdvance = useCallback(() => {
    if (!session || !caseSummary) return;
    advanceSession(caseSummary.slug);
    if (nextSessionSlug) {
      router.push(`${baseHref}/practice/${nextSessionSlug}`);
    }
  }, [session, caseSummary, advanceSession, nextSessionSlug, router, baseHref]);
  const handleSessionFinish = useCallback(() => {
    if (!session || !caseSummary) return;
    if (session.status !== "completed") {
      advanceSession(caseSummary.slug);
    }
    endSession();
    router.push(`${baseHref}/build`);
  }, [session, caseSummary, advanceSession, endSession, router, baseHref]);

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

  return (
    <div className="space-y-6">
      <header className={`relative overflow-hidden rounded-3xl border border-slate-800/60 bg-gradient-to-r ${theme.headerGradient} p-6 shadow-2xl shadow-indigo-950/30`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.15),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(56,189,248,0.15),transparent_55%)]" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${theme.chip}`}>
              {state.phase <= 1 ? "Phase 1 - Diagnosis hunt" : "Phase 2 - Management cascade"}
            </span>
            <h1 className="text-3xl font-semibold text-white md:text-4xl lg:text-5xl">{caseSummary.title}</h1>
            <p className="max-w-2xl text-sm text-slate-200 md:text-base">{caseSummary.overview ?? caseSummary.subtitle ?? "Move through the scene-by-scene investigation. We will prompt you when it is time to continue."}</p>
            <QuickPrimer />
          </div>
          <div className="flex flex-wrap items-start gap-4 text-sm text-slate-100">
            <EnergyMeter energy={state.masteryEnergy} comboLevel={state.comboLevel} />
            <StatCard label="Time budget" value={`${state.timeSpent} / ${caseSummary.estimatedMinutes ?? 20} min`} helper="Target the budget but do not rush." accent={theme.statAccent} />
            <StatCard label="Score" value={`${state.score > 0 ? "+" : ""}${state.score}`} helper="Score shifts with each decision." accent={theme.statAccent} />
            <StatCard label="Actions" value={`${state.totalActions}`} helper={`${state.mistakes} missteps - streak ${state.streak}`} accent={theme.statAccent} />
            {session && <SessionBadge session={session} currentSlug={caseSummary.slug} />}
            <div className="min-w-[140px] text-xs text-slate-400">
              {saveStatus === "saving" && <span>Syncing attempt...</span>}
              {saveStatus === "saved" && <span className="text-emerald-300">Attempt saved</span>}
              {saveStatus === "error" && (
                <span className="flex items-center gap-2 text-amber-300">
                  Sync failed
                  <button
                    type="button"
                    className="rounded border border-amber-400/60 px-2 py-[2px] text-xs text-amber-200 hover:border-amber-300 hover:text-amber-100"
                    onClick={() => {
                      attemptSignatureRef.current = null;
                      inFlightSignatureRef.current = null;
                      setSaveStatus("idle");
                    }}
                  >
                    Retry
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <StageStepper items={orderedStages} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr),minmax(0,1fr)]">
        <StagePanel
          stage={currentStage}
          stepIndex={currentIndex}
          totalSteps={totalSteps}
          caseSummary={caseSummary}
          selected={selectedForStage}
          onSelect={(option) => selectOption(option.value, currentStage?.slug)}
          onAdvance={advance}
          onTriggerInteraction={(interactionId) => triggerInteraction(interactionId, currentStage?.slug ?? undefined)}
          onReset={reset}
          isCompleted={state.status === "completed"}
          baseHref={baseHref}
          theme={theme}
          recommended={recommendedOption?.value ?? null}
          feedbackStep={state.lastStep}
          triggeredInteractions={triggeredInteractions}
          session={session}
          sessionCursor={sessionIndex}
          onSessionAdvance={nextSessionSlug ? handleSessionAdvance : undefined}
          onSessionFinish={session ? handleSessionFinish : undefined}
          nextSessionSlug={nextSessionSlug}
        />

        <RightRail
          theme={theme}
          engineState={state}
          progressPercent={progressPercent}
          achievements={achievements}
        />
      </div>
    </div>
  );
}

function buildStepper(state: CaseEngineState): StageStepperItem[] {
  const visited = new Set(state.visitedStageSlugs);
  return state.orderedStageSlugs.map((slug) => {
    const stage = state.stageMap[slug];
    const status: StageStepperItem["status"] = slug === state.currentStageSlug ? "current" : visited.has(slug) ? "completed" : "upcoming";
    return {
      slug,
      title: stage?.title ?? slug,
      stageType: stage?.stageType ?? "info",
      phase: stage?.phase ?? 1,
      status,
    };
  });
}

function StageStepper({ items }: { items: StageStepperItem[] }) {
  return (
    <div className="overflow-x-auto py-2">
      <ol className="flex min-w-full gap-2">
        {items.map((item, index) => {
          const badge = item.status === "completed" ? "bg-emerald-500/20 border-emerald-400" : item.status === "current" ? "bg-indigo-500/20 border-indigo-400" : "bg-slate-900/70 border-slate-700";
          return (
            <li key={item.slug} className={`flex min-w-[140px] flex-1 items-center gap-3 rounded-2xl border px-4 py-3 text-xs uppercase tracking-[0.25em] text-slate-300 ${badge}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold ${item.status === "completed" ? "bg-emerald-500 text-emerald-950" : item.status === "current" ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-200"}`}>
                {index + 1}
              </span>
              <div className="min-w-0 text-left">
                <p className="text-[10px] tracking-[0.3em] text-slate-400">Phase {item.phase}</p>
                <p className="truncate text-[11px] font-semibold text-white">{item.title}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StagePanel({
  stage,
  stepIndex,
  totalSteps,
  caseSummary,
  selected,
  onSelect,
  onAdvance,
  onTriggerInteraction,
  onReset,
  isCompleted,
  baseHref,
  theme,
  recommended,
  feedbackStep,
  triggeredInteractions,
  session,
  sessionCursor,
  onSessionAdvance,
  onSessionFinish,
  nextSessionSlug,
}: {
  stage?: CaseStage;
  stepIndex: number;
  totalSteps: number;
  caseSummary: CaseSummary;
  selected: string[];
  onSelect: (option: CaseStageOption) => void;
  onAdvance: () => void;
  onTriggerInteraction: (interactionId: string) => void;
  onReset: () => void;
  isCompleted: boolean;
  baseHref: string;
  theme: typeof DIAGNOSIS_THEME;
  recommended: string | null;
  feedbackStep?: CaseEngineStep;
  triggeredInteractions: Set<string>;
  session?: ActiveSession | null;
  sessionCursor: number;
  onSessionAdvance?: () => void;
  onSessionFinish?: () => void;
  nextSessionSlug?: string | null;
}) {
  if (!stage) {
    return (
      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-8 text-center text-slate-200 shadow-xl shadow-indigo-950/10">
        <p>{isCompleted ? "Saga complete!" : "Loading stage..."}</p>
      </div>
    );
  }

  const options = stage.options ?? [];
  const stepNumber = stepIndex >= 0 ? stepIndex + 1 : 1;
  const total = totalSteps || 1;
  const infoOnly = options.length === 0;
  const interactions = stage.interactions ?? [];
  const feedback = feedbackStep && feedbackStep.stageSlug === stage.slug ? feedbackStep : undefined;
  const inSession = Boolean(session && sessionCursor >= 0);
  const sessionTotal = session?.caseSlugs.length ?? 0;
  const showNextCaseButton = Boolean(onSessionAdvance && nextSessionSlug);
  const showFinishSessionButton = Boolean(onSessionFinish && session && session.status === "active" && !nextSessionSlug);
  const showReturnToBuilder = Boolean(onSessionFinish && session && session.status === "completed");

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 shadow-xl shadow-indigo-950/10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className={`rounded-full border ${theme.stepChip} px-3 py-1 uppercase tracking-[0.3em]`}>Step {stepNumber} of {total}</span>
              <span className={`rounded-full border border-slate-700 px-3 py-1 uppercase tracking-[0.3em] ${STAGE_TYPE_META[stage.stageType].accent}`}>{stage.stageType}</span>
              {inSession && (
                <span className="rounded-full border border-indigo-400 px-3 py-1 uppercase tracking-[0.3em] text-indigo-200">
                  Session {sessionCursor + 1} of {sessionTotal}
                </span>
              )}
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-white">{stage.title}</h2>
            {stage.subtitle && <p className="mt-1 text-sm text-slate-300">{stage.subtitle}</p>}
          </div>
          <div className="space-y-2 text-xs text-slate-400">
            <span className="block rounded-full border border-slate-700 px-3 py-1 uppercase tracking-[0.3em]">Phase {stage.phase}</span>
            <CoachCallout stageType={stage.stageType} />
          </div>
        </header>

        {stage.info.length > 0 && (
          <ul className="mt-5 space-y-2 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 text-sm text-slate-200">
            {stage.info.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {interactions.length > 0 && (
          <InteractionPanel
            interactions={interactions}
            triggered={triggeredInteractions}
            onTrigger={onTriggerInteraction}
            disabled={isCompleted}
          />
        )}

        {infoOnly ? (
          <div className="mt-6">
            <button
              onClick={onAdvance}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:translate-y-[-1px] hover:shadow-indigo-700/30"
              disabled={isCompleted}
            >
              Continue to the next clue
            </button>
            <p className="mt-3 text-xs text-slate-400">Read the clue and continue. Optional inspections stay available above.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {options.map((option, index) => (
              <ActionCard
                key={option.value}
                option={option}
                index={index}
                hotkey={HOTKEYS[index]}
                selected={selected.includes(option.value)}
                disabled={isCompleted}
                onChoose={() => onSelect(option)}
                recommended={recommended === option.value}
              />
            ))}
          </div>
        )}
      </div>

      <FeedbackPanel step={feedback} />

      {isCompleted && (
        <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-sm text-emerald-100 shadow-lg shadow-emerald-900/30">
          <h3 className="text-lg font-semibold text-emerald-100">Diagnosis unlocked!</h3>
          <p className="mt-2 text-emerald-200/80">You completed the reasoning arc. Jump into the debrief or reset to explore alternate paths.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {showNextCaseButton && (
              <button
                onClick={onSessionAdvance}
                className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
              >
                Load next case
              </button>
            )}
            {showFinishSessionButton && (
              <button
                onClick={onSessionFinish}
                className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
              >
                Finish session
              </button>
            )}
            {showReturnToBuilder && (
              <button
                onClick={onSessionFinish}
                className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
              >
                Return to builder
              </button>
            )}
            <Link href={`${baseHref}/debrief/${caseSummary.id}`} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400">
              Open debrief
            </Link>
            <button onClick={onReset} className="rounded-full border border-emerald-500/60 px-4 py-2 text-sm text-emerald-100 hover:border-emerald-400">
              Reset case
            </button>
          </div>
          {showFinishSessionButton && (
            <p className="mt-3 text-xs text-slate-400">This was the final case in your session. Finish to wrap up your run.</p>
          )}
          {showReturnToBuilder && (
            <p className="mt-3 text-xs text-slate-400">Session completed. Head back to the builder for the next plan.</p>
          )}
        </div>
      )}
    </section>
  );
}

function InteractionPanel({
  interactions,
  triggered,
  onTrigger,
  disabled,
}: {
  interactions: CaseStageInteraction[];
  triggered: Set<string>;
  onTrigger: (interactionId: string) => void;
  disabled: boolean;
}) {
  if (!interactions.length) return null;
  return (
    <div className="mt-6 space-y-3 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="uppercase tracking-[0.3em]">Optional inspections</span>
        <span>Unlock more clues before you continue.</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {interactions.map((interaction) => {
          const used = triggered.has(interaction.id);
          return (
            <button
              key={interaction.id}
              onClick={() => onTrigger(interaction.id)}
              disabled={disabled || used}
              className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                used ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100" : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-indigo-400"
              } ${disabled ? "opacity-60" : ""}`}
            >
              {interaction.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FeedbackPanel({ step }: { step?: CaseEngineStep }) {
  if (!step) return null;
  const hasCommentary = step.commentary && step.commentary.length > 0;
  const hasBadge = Boolean(step.badgeEarned);
  const hasFailure = Boolean(step.failure);
  const hasFeedback = Boolean(step.feedback || hasCommentary || hasBadge || hasFailure);
  if (!hasFeedback) return null;

  const baseMeta = step.kind === "interaction"
    ? STEP_BADGE_META.interaction
    : step.kind === "system"
      ? STEP_BADGE_META.system
      : step.isCorrect
        ? STEP_BADGE_META.correct
        : STEP_BADGE_META.incorrect;
  const toneMeta = step.tone ? TONE_META[step.tone] : undefined;
  const badgeClass = toneMeta?.className ?? baseMeta.className;
  const badgeLabel = toneMeta?.label ?? baseMeta.label;
  const toneHelper = toneMeta?.helper;
  const fatal = step.failure?.fatal ?? false;

  const badgeChipClass = `rounded-full px-3 py-1 font-semibold uppercase tracking-[0.3em] ${badgeClass}`;
  const failureClass = fatal
    ? "mt-3 rounded-2xl border border-rose-500 bg-rose-600/20 p-3 text-rose-50"
    : "mt-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-rose-100";

  return (
    <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5 text-sm text-slate-200 shadow-xl shadow-indigo-950/10">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className={badgeChipClass}>{badgeLabel}</span>
          {toneMeta && (
            <span className="rounded-full border border-slate-700 px-2 py-0.5 uppercase tracking-[0.3em] text-slate-300">{baseMeta.label}</span>
          )}
        </div>
        {step.audio && <AudioCue src={step.audio} label={toneMeta?.label ?? baseMeta.label} />}
      </div>
      {toneHelper && <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-slate-400">{toneHelper}</p>}
      {step.funStatus && <p className="mt-2 text-xs text-slate-400">{step.funStatus}</p>}
      {step.feedback && <p className="mt-3 text-slate-200">{step.feedback}</p>}
      {hasCommentary && (
        <ul className="mt-2 space-y-2 text-slate-300">
          {step.commentary!.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      )}
      {hasFailure && (
        <div className={failureClass}>
          <p className="font-semibold">{step.failure!.headline}</p>
          {step.failure!.detail && <p className="mt-1 text-sm text-current/80">{step.failure!.detail}</p>}
          {fatal && <p className="mt-2 text-[11px] uppercase tracking-[0.3em]">Run ended - reset to explore fresh branches.</p>}
        </div>
      )}
      {hasBadge && (
        <div className="mt-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-emerald-100">
          <p className="text-xs uppercase tracking-[0.3em]">Badge earned</p>
          <p className="mt-1 text-sm font-semibold text-white">{step.badgeEarned!.label}</p>
          {step.badgeEarned!.description && <p className="mt-1 text-xs text-emerald-100/80">{step.badgeEarned!.description}</p>}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
        <span>Energy {step.masteryEnergyDelta >= 0 ? '+' : ''}{Math.round(step.masteryEnergyDelta)}</span>
        <span>Score {step.scoreDelta >= 0 ? '+' : ''}{step.scoreDelta}</span>
        <span>Cost {step.costTime} min</span>
      </div>
    </div>
  );
}

function AudioCue({ src, label }: { src: string; label?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }, [src]);

  const audioButtonClass = `rounded-full border px-3 py-1 font-semibold uppercase tracking-[0.3em] ${isPlaying ? 'border-emerald-400 text-emerald-200' : 'border-slate-700 text-slate-300 hover:border-indigo-400'}`;

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      <button
        type="button"
        onClick={() => {
          const audio = audioRef.current;
          if (!audio) return;
          if (audio.paused) {
            const playPromise = audio.play();
            if (playPromise) {
              playPromise.catch(() => setIsPlaying(false));
            }
          } else {
            audio.pause();
          }
        }}
        className={audioButtonClass}
        aria-pressed={isPlaying}
      >
        {isPlaying ? 'Pause audio' : label ? `Play ${label.toLowerCase()}` : 'Play audio cue'}
      </button>
    </div>
  );
}

function ActionCard({
  option,
  index,
  hotkey,
  selected,
  disabled,
  onChoose,
  recommended,
}: {
  option: CaseStageOption;
  index: number;
  hotkey?: string;
  selected: boolean;
  disabled: boolean;
  onChoose: () => void;
  recommended: boolean;
}) {
  const cost = option.costTime ?? 0;
  const delta = option.scoreDelta ?? 0;
  const badge = selected ? "border-emerald-400 bg-emerald-500/10" : "border-slate-800 bg-slate-900/60";
  const accent = delta >= 0 ? "text-emerald-300" : "text-rose-300";

  return (
    <button
      onClick={onChoose}
      disabled={disabled || selected}
      className={`w-full rounded-2xl border px-5 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-400/70 ${badge} ${disabled ? "opacity-60" : "hover:border-indigo-400/80"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
            <span>{hotkey ? `Key ${hotkey}` : `#${index + 1}`}</span>
            {selected && <span className="text-emerald-300">Locked in</span>}
            {!selected && recommended && <span className="text-indigo-300">High yield</span>}
          </div>
          <p className="mt-1 text-base font-semibold text-white">{option.label}</p>
          {option.description && <p className="mt-1 text-sm text-slate-300">{option.description}</p>}
          {option.detail && <p className="mt-2 text-xs text-slate-400">{option.detail}</p>}
        </div>
        <div className="flex flex-col items-end text-xs text-slate-300">
          <span className="rounded-full border border-slate-700 px-2 py-0.5 uppercase tracking-[0.2em]">{cost} min</span>
          <span className={`mt-2 text-sm font-semibold ${accent}`}>
            {delta >= 0 ? "+" : ""}
            {delta} pts
          </span>
        </div>
      </div>
    </button>
  );
}

function RightRail({
  theme,
  engineState,
  progressPercent,
  achievements,
}: {
  theme: typeof DIAGNOSIS_THEME;
  engineState: CaseEngineState;
  progressPercent: number;
  achievements: Achievement[];
}) {
  return (
    <aside className="space-y-4">
      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5 text-sm text-slate-200 shadow-xl shadow-indigo-950/10">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Progress</p>
        <ProgressBar percent={progressPercent} label={progressPercent >= 100 ? "Case complete" : `${progressPercent}% ready`} />
        <div className="mt-4 grid gap-2 text-xs text-slate-400">
          <span>Mastery energy {Math.round(engineState.masteryEnergy)} / 150</span>
          <span>Combo streak {engineState.streak}</span>
          <span>Scenes visited {engineState.visitedStageSlugs.length} / {engineState.orderedStageSlugs.length}</span>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-5 text-sm text-slate-200 shadow-xl shadow-indigo-950/10">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Hypothesis board</p>
        {engineState.hypotheses.length === 0 ? (
          <p className="mt-3 text-xs text-slate-400">Hypotheses appear as you gather evidence.</p>
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
          <p className="mt-3 text-xs text-slate-400">Key findings land here after each action.</p>
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
          <ResourceRow label="Minutes spent" value={`${engineState.timeSpent} min`} theme={theme} />
          <ResourceRow label="Actions taken" value={`${engineState.totalActions}`} theme={theme} />
          <ResourceRow label="Mistakes" value={`${engineState.mistakes}`} theme={theme} />
          <ResourceRow label="Combo level" value={`${engineState.comboLevel}`} theme={theme} />
        </div>
      </div>

      <AchievementsList achievements={achievements} />
    </aside>
  );
}

function QuickPrimer() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-xs text-slate-200">
      <p className="font-semibold text-white">How to move through a case</p>
      <ol className="mt-2 list-decimal space-y-1 pl-4 text-slate-300">
        <li>Read the clue card.</li>
        <li>Pick the action that best advances the workup.</li>
        <li>Tap Continue when a card has no actions.</li>
      </ol>
    </div>
  );
}

function CoachCallout({ stageType }: { stageType: CaseStage["stageType"] }) {
  const helper = STAGE_TYPE_META[stageType].helper;
  return <span className="rounded-full border border-slate-800 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-slate-400">{helper}</span>;
}

function ResourceRow({ label, value, theme }: { label: string; value: string; theme: typeof DIAGNOSIS_THEME }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/50 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${theme.statAccent}`}>{value}</span>
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
            className={`rounded-2xl border px-3 py-2 text-xs ${achievement.status === "earned" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100" : "border-slate-800 bg-slate-900/60 text-slate-300"}`}
          >
            <p className="font-semibold text-white">{achievement.title}</p>
            <p className="mt-1 text-[11px] text-current">{achievement.detail}</p>
          </li>
        ))}
      </ul>
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

function StatCard({
  label,
  value,
  helper,
  accent,
}: {
  label: string;
  value: string;
  helper: string;
  accent: string;
}) {
  return (
    <div className="flex min-w-[180px] flex-col gap-2 rounded-2xl border border-slate-800/60 bg-slate-950/70 p-4 text-xs text-slate-200 shadow-lg shadow-indigo-950/10">
      <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{label}</span>
      <span className={`text-2xl font-semibold ${accent}`}>{value}</span>
      <span className="text-xs text-slate-400">{helper}</span>
    </div>
  );
}

function SessionBadge({ session, currentSlug }: { session: ActiveSession; currentSlug: string }) {
  if (!session.caseSlugs.length) return null;
  const index = session.caseSlugs.indexOf(currentSlug);
  if (index === -1) return null;
  const total = session.caseSlugs.length;
  const remaining = Math.max(total - index - 1, 0);
  const statusLabel = session.status === "completed" ? "Completed" : `${remaining} remaining`;
  return (
    <div className="flex min-w-[180px] flex-col gap-1 rounded-2xl border border-slate-800/60 bg-slate-950/70 p-4 text-xs text-slate-200 shadow-lg shadow-indigo-950/10">
      <span className="text-[10px] uppercase tracking-[0.3em] text-indigo-200">Session</span>
      <span className="text-lg font-semibold text-white">{index + 1} / {total}</span>
      <span className="text-[11px] text-slate-400">{statusLabel}</span>
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

const STAGE_TYPE_META: Record<CaseStage["stageType"], { label: string; helper: string; accent: string }> = {
  info: { label: "Intel drop", helper: "Read the clue then continue", accent: "text-indigo-200" },
  decision: { label: "Decision node", helper: "Pick the best next move", accent: "text-emerald-200" },
  order: { label: "Ordering bay", helper: "Choose the highest-yield test", accent: "text-sky-200" },
  diagnosis: { label: "Hypothesis lock", helper: "Commit to the most likely answer", accent: "text-amber-200" },
  management: { label: "Management cascade", helper: "Advance care deliberately", accent: "text-orange-200" },
  summary: { label: "Debrief", helper: "Review what you learned", accent: "text-fuchsia-200" },
};

const DIAGNOSIS_THEME = {
  headerGradient: "from-sky-600/40 via-slate-900 to-slate-950",
  chip: "border-sky-500/40 bg-sky-500/10 text-sky-100",
  statAccent: "text-sky-200",
  stepChip: "border-slate-700",
};

const MANAGEMENT_THEME = {
  headerGradient: "from-amber-600/40 via-slate-900 to-slate-950",
  chip: "border-amber-500/50 bg-amber-500/10 text-amber-100",
  statAccent: "text-amber-200",
  stepChip: "border-slate-700",
};


