import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type {
  CaseSummary,
  CaseStage,
  CaseStageOption,
  CaseStageInteraction,
  StageType,
  BadgeReward,
  OptionFailure,
  CommentaryTone,
} from "@/lib/cases/types";

export interface CaseEngineStep {
  id: string;
  kind: "option" | "interaction" | "system";
  stageSlug: string;
  stageTitle: string;
  stageType: StageType;
  optionValue: string | null;
  optionLabel: string | null;
  isCorrect: boolean | null;
  feedback?: string;
  commentary?: string[] | null;
  tone?: CommentaryTone;
  funStatus?: string | null;
  audio?: string | null;
  badgeEarned?: BadgeReward | null;
  failure?: OptionFailure | null;
  interactionId?: string | null;
  reveals: string[];
  costTime: number;
  scoreDelta: number;
  cumulativeScore: number;
  cumulativeTime: number;
  phase: number;
  takenAt: number;
  outcomes?: Record<string, unknown> | null;
  masteryEnergy: number;
  masteryEnergyDelta: number;
  comboLevel: number;
}

export interface CaseEngineState {
  status: "loading" | "active" | "completed" | "unsupported";
  summary?: CaseSummary;
  stageMap: Record<string, CaseStage>;
  orderedStageSlugs: string[];
  currentStageSlug: string | null;
  phase: number;
  score: number;
  timeSpent: number;
  totalActions: number;
  mistakes: number;
  streak: number;
  comboLevel: number;
  masteryEnergy: number;
  evidence: string[];
  hypotheses: string[];
  timeline: CaseEngineStep[];
  visitedStageSlugs: string[];
  selectedOptions: Record<string, string[]>;
  phaseTransitions: Array<{ from: number; to: number; at: string }>;
  badges: BadgeReward[];
  lastStep?: CaseEngineStep;
  lastFeedback?: string;
  lastOutcome?: Record<string, unknown> | null;
}

type CaseEngineAction =
  | { type: "hydrate"; summary: CaseSummary | undefined }
  | { type: "reset"; summary?: CaseSummary }
  | { type: "select-option"; stageSlug?: string; optionValue: string }
  | { type: "jump-stage"; stageSlug: string }
  | { type: "advance-stage"; stageSlug?: string };
  | { type: "trigger-interaction"; stageSlug?: string; interactionId: string };

const INITIAL_STATE: CaseEngineState = {
  status: "loading",
  stageMap: {},
  orderedStageSlugs: [],
  currentStageSlug: null,
  phase: 1,
  score: 0,
  timeSpent: 0,
  totalActions: 0,
  mistakes: 0,
  streak: 0,
  comboLevel: 0,
  masteryEnergy: 100,
  evidence: [],
  hypotheses: [],
  timeline: [],
  visitedStageSlugs: [],
  selectedOptions: {},
  phaseTransitions: [],
  badges: [],
  lastOutcome: null,
};

function clampEnergy(value: number) {
  if (value < 0) return 0;
  if (value > 150) return 150;
  return value;
}

function computeOrderedStageSlugs(stages: CaseStage[]): string[] {
  return [...stages]
    .sort((a, b) => {
      if (a.phase === b.phase) return a.orderIndex - b.orderIndex;
      return a.phase - b.phase;
    })
    .map((stage) => stage.slug);
}

function deriveHypotheses(evidence: string[]): string[] {
  const hypotheses = new Set<string>();
  for (const item of evidence) {
    const value = item.trim();
    if (!value) continue;
    const lower = value.toLowerCase();
    if (lower.startsWith("working list")) {
      const [, payload] = value.split(":");
      if (payload) {
        payload
          .split(/[,;]+/)
          .map((segment) => segment.trim())
          .filter(Boolean)
          .forEach((segment) => hypotheses.add(segment));
      }
      continue;
    }
    if (lower.startsWith("diagnosis")) {
      const [, payload] = value.split(":");
      if (payload) hypotheses.add(payload.trim());
      continue;
    }
    if (lower.startsWith("plan")) {
      hypotheses.add(value.replace(/^plan:\s*/i, "").trim());
    }
  }
  return Array.from(hypotheses);
}

function findNextStageSlug(ordered: string[], current: string): string | null {
  const idx = ordered.indexOf(current);
  if (idx === -1) return null;
  return ordered[idx + 1] ?? null;
}

function createInitialState(summary: CaseSummary | undefined): CaseEngineState {
  if (!summary) {
    return INITIAL_STATE;
  }

  if (!summary.graph) {
    return {
      ...INITIAL_STATE,
      status: "unsupported",
      summary,
    };
  }

  const { stages, stageMap, entryStageSlug } = summary.graph;
  const orderedStageSlugs = computeOrderedStageSlugs(stages);
  const entrySlug = entryStageSlug || orderedStageSlugs[0] || null;
  const entryStage = entrySlug ? stageMap[entrySlug] : undefined;

  if (!entryStage) {
    return {
      ...INITIAL_STATE,
      status: "unsupported",
      summary,
      stageMap,
      orderedStageSlugs,
    };
  }

  const visitedStageSlugs = entrySlug ? [entrySlug] : [];

  return {
    ...INITIAL_STATE,
    status: "active",
    summary,
    stageMap,
    orderedStageSlugs,
    currentStageSlug: entrySlug,
    phase: entryStage.phase,
    visitedStageSlugs,
    masteryEnergy: 100,
    comboLevel: 0,
    selectedOptions: {},
    phaseTransitions: [],
  };
}

function registerSelection(state: CaseEngineState, stage: CaseStage, option: CaseStageOption, config?: { neutral?: boolean; kind?: CaseEngineStep["kind"] }) {
  const selected = state.selectedOptions[stage.slug] ?? [];
  if (!stage.allowMultiple && selected.includes(option.value)) {
    return state;
  }
  if (stage.allowMultiple && selected.includes(option.value)) {
    return state;
  }

  const neutral = config?.neutral ?? false;
  const costTime = neutral ? 0 : option.costTime ?? 0;
  const scoreDelta = neutral ? 0 : option.scoreDelta ?? 0;
  const newScore = state.score + scoreDelta;
  const newTime = state.timeSpent + costTime;
  const reveals = option.reveals ?? [];

  const evidenceSet = new Set(state.evidence);
  reveals.forEach((item) => evidenceSet.add(item));
  const evidence = Array.from(evidenceSet);
  const hypotheses = deriveHypotheses(evidence);

  const feedback = typeof option.outcomes?.feedback === "string" ? (option.outcomes?.feedback as string) : undefined;
  const commentary = option.commentary ?? [];
  const tone = option.tone;
  const funStatus = option.funStatus ?? null;
  const badge = option.badge ?? null;
  const failure = option.failure ?? null;
  const audio = option.audio ?? null;
  const energyOverride = option.energyDeltaOverride ?? null;

  const newStreak = neutral ? state.streak : option.isCorrect ? state.streak + 1 : 0;
  const mistakes = neutral ? state.mistakes : state.mistakes + (option.isCorrect ? 0 : 1);
  const comboLevel = neutral ? state.comboLevel : newStreak >= 3 ? Math.min(5, newStreak - 2) : 0;
  const baseEnergyDelta = neutral ? 0 : -costTime * 0.6 + scoreDelta * 1.2 + (option.isCorrect ? 8 : -10) + comboLevel * 2;
  const appliedEnergyDelta = energyOverride ?? baseEnergyDelta;
  const newEnergy = clampEnergy(state.masteryEnergy + appliedEnergyDelta);
  const energyDelta = newEnergy - state.masteryEnergy;

  const step: CaseEngineStep = {
    id: `${stage.slug}:${option.value}:${state.timeline.length + 1}`,
    kind: config?.kind ?? "option",
    stageSlug: stage.slug,
    stageTitle: stage.title,
    stageType: stage.stageType,
    optionValue: option.value,
    optionLabel: option.label,
    isCorrect: option.isCorrect,
    feedback,
    commentary: commentary.length ? commentary : null,
    tone,
    funStatus,
    audio,
    badgeEarned: badge ?? null,
    failure: failure ?? null,
    interactionId: null,
    reveals,
    costTime,
    scoreDelta,
    cumulativeScore: newScore,
    cumulativeTime: newTime,
    phase: stage.phase,
    takenAt: Date.now(),
    outcomes: option.outcomes ?? null,
    masteryEnergy: newEnergy,
    masteryEnergyDelta: energyDelta,
    comboLevel,
  };

  const timeline = [...state.timeline, step];

  const selectedOptions = {
    ...state.selectedOptions,
    [stage.slug]: stage.allowMultiple ? [...selected, option.value] : [option.value],
  };

  let badges = state.badges;
  if (badge) {
    const exists = badges.some((item) => item.id === badge.id);
    if (!exists) {
      badges = [...badges, badge];
    }
  }

  return {
    ...state,
    score: newScore,
    timeSpent: newTime,
    totalActions: state.totalActions + 1,
    mistakes,
    streak: newStreak,
    comboLevel,
    masteryEnergy: newEnergy,
    evidence,
    hypotheses,
    timeline,
    selectedOptions,
    badges,
    lastStep: step,
    lastFeedback: feedback,
    lastOutcome: option.outcomes ?? null,
  } satisfies CaseEngineState;
}


function nextStateAfterSelection(state: CaseEngineState, stage: CaseStage, option: CaseStageOption, config?: { neutral?: boolean; kind?: CaseEngineStep["kind"] }): CaseEngineState {
  const registered = registerSelection(state, stage, option, config);
  let nextStageSlug = option.advanceTo ?? null;

  if (!nextStageSlug && stage.allowMultiple) {
    nextStageSlug = stage.slug;
  }

  if (!nextStageSlug) {
    nextStageSlug = findNextStageSlug(state.orderedStageSlugs, stage.slug);
  }

  const nextStage = nextStageSlug ? registered.stageMap[nextStageSlug] : undefined;

  const visitedStageSlugs = nextStageSlug && !registered.visitedStageSlugs.includes(nextStageSlug)
    ? [...registered.visitedStageSlugs, nextStageSlug]
    : registered.visitedStageSlugs;

  const phaseTransitions = !nextStage || nextStage.phase === stage.phase
    ? registered.phaseTransitions
    : [...registered.phaseTransitions, { from: stage.phase, to: nextStage.phase, at: registered.lastStep?.id ?? `${stage.slug}:${option.value}` }];

  const caseCompleted = Boolean(option.outcomes?.caseComplete) || (!nextStageSlug && stage.isTerminal) || (nextStage?.isTerminal ?? false);

  return {
    ...registered,
    status: caseCompleted ? "completed" : registered.status,
    currentStageSlug: nextStage ? nextStage.slug : caseCompleted ? stage.slug : null,
    phase: nextStage?.phase ?? stage.phase,
    visitedStageSlugs,
    phaseTransitions,
  } satisfies CaseEngineState;
}

function advanceStage(state: CaseEngineState, stage: CaseStage): CaseEngineState {
  if (stage.options.length > 0) {
    return state;
  }

  const continueOption: CaseStageOption = {
    id: -1,
    value: "__advance__",
    label: "Continue",
    description: "",
    detail: "",
    isCorrect: true,
    advanceTo: null,
    costTime: 0,
    scoreDelta: 0,
    reveals: [],
    outcomes: null,
  };

  return nextStateAfterSelection(state, stage, continueOption, { neutral: true, kind: "system" });
}


function triggerInteraction(state: CaseEngineState, stage: CaseStage, interaction: CaseStageInteraction): CaseEngineState {
  const reveals = interaction.reveals ?? [];
  const evidenceSet = new Set(state.evidence);
  reveals.forEach((item) => evidenceSet.add(item));
  const evidence = Array.from(evidenceSet);
  const hypotheses = deriveHypotheses(evidence);
  const energyDelta = interaction.energyDelta ?? 0;
  const newEnergy = clampEnergy(state.masteryEnergy + energyDelta);
  const step: CaseEngineStep = {
    id: `${stage.slug}:interaction:${interaction.id}:${state.timeline.length + 1}`,
    kind: "interaction",
    stageSlug: stage.slug,
    stageTitle: stage.title,
    stageType: stage.stageType,
    optionValue: null,
    optionLabel: interaction.label,
    isCorrect: null,
    feedback: undefined,
    commentary: interaction.commentary && interaction.commentary.length ? interaction.commentary : null,
    tone: undefined,
    funStatus: null,
    audio: interaction.audio ?? null,
    badgeEarned: interaction.badge ?? null,
    failure: null,
    interactionId: interaction.id,
    reveals,
    costTime: 0,
    scoreDelta: 0,
    cumulativeScore: state.score,
    cumulativeTime: state.timeSpent,
    phase: stage.phase,
    takenAt: Date.now(),
    outcomes: null,
    masteryEnergy: newEnergy,
    masteryEnergyDelta: newEnergy - state.masteryEnergy,
    comboLevel: state.comboLevel,
  };

  const timeline = [...state.timeline, step];
  let badges = state.badges;
  if (interaction.badge) {
    const exists = badges.some((item) => item.id === interaction.badge.id);
    if (!exists) {
      badges = [...badges, interaction.badge];
    }
  }

  return {
    ...state,
    totalActions: state.totalActions + 1,
    masteryEnergy: newEnergy,
    evidence,
    hypotheses,
    timeline,
    badges,
    lastStep: step,
    lastFeedback: undefined,
    lastOutcome: null,
  } satisfies CaseEngineState;
}



function caseEngineReducer(state: CaseEngineState, action: CaseEngineAction): CaseEngineState {
  switch (action.type) {
    case "hydrate":
      return createInitialState(action.summary);
    case "reset":
      return createInitialState(action.summary ?? state.summary);
    case "jump-stage": {
      if (state.status === "loading" || state.status === "unsupported") return state;
      if (!state.stageMap[action.stageSlug]) return state;
      return {
        ...state,
        currentStageSlug: action.stageSlug,
        phase: state.stageMap[action.stageSlug].phase,
      } satisfies CaseEngineState;
    }
    case "select-option": {
      if (state.status !== "active" && state.status !== "completed") return state;
      const stageSlug = action.stageSlug ?? state.currentStageSlug;
      if (!stageSlug) return state;
      const stage = state.stageMap[stageSlug];
      if (!stage) return state;
      const option = stage.options.find((candidate) => candidate.value === action.optionValue);
      if (!option) return state;
      return nextStateAfterSelection(state, stage, option);
    }
    case "advance-stage": {
      if (state.status !== "active" && state.status !== "completed") return state;
      const stageSlug = action.stageSlug ?? state.currentStageSlug;
      if (!stageSlug) return state;
      const stage = state.stageMap[stageSlug];
      if (!stage) return state;
      return advanceStage(state, stage);
    }
    case "trigger-interaction": {
      if (state.status !== "active" && state.status !== "completed") return state;
      const stageSlug = action.stageSlug ?? state.currentStageSlug;
      if (!stageSlug) return state;
      const stage = state.stageMap[stageSlug];
      if (!stage) return state;
      const interaction = stage.interactions?.find((item) => item.id === action.interactionId);
      if (!interaction) return state;
      return triggerInteraction(state, stage, interaction);
    }
    default:
      return state;
  }
}

export function useCaseEngine(summary: CaseSummary | undefined) {
  const [state, dispatch] = useReducer(caseEngineReducer, summary, createInitialState);
  const currentStageRef = useRef<string | null>(state.currentStageSlug);

  useEffect(() => {
    currentStageRef.current = state.currentStageSlug;
  }, [state.currentStageSlug]);

  useEffect(() => {
    dispatch({ type: "hydrate", summary });
  }, [summary?.id]);

  const selectOption = useCallback(
    (optionValue: string, stageSlug?: string) => {
      const target = stageSlug ?? currentStageRef.current;
      if (!target) return;
      dispatch({ type: "select-option", stageSlug: target, optionValue });
    },
    []
  );

  const reset = useCallback(() => {
    dispatch({ type: "reset" });
  }, []);

  const advance = useCallback(() => {
    const target = currentStageRef.current;
    if (!target) return;
    dispatch({ type: "advance-stage", stageSlug: target });
  }, []);

  const jumpToStage = useCallback(
    (stageSlug: string) => {
      dispatch({ type: "jump-stage", stageSlug });
    },
    []
  );


  const triggerInteraction = useCallback((interactionId: string, stageSlug?: string) => {
    const target = stageSlug ?? currentStageRef.current;
    if (!target) return;
    dispatch({ type: "trigger-interaction", stageSlug: target, interactionId });
  }, []);

  const currentStage = useMemo(() => {
    if (!state.currentStageSlug) return undefined;
    return state.stageMap[state.currentStageSlug];
  }, [state.currentStageSlug, state.stageMap]);

  return {
    state,
    selectOption,
    reset,
    advance,
    triggerInteraction,
    jumpToStage,
    currentStage,
  };
}
