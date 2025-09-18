"use client";

import { createContext, useContext, useMemo, useReducer } from "react";
import {
  buildTodayPlan,
  buildPaceStatus,
  buildWeaknessNudges,
  buildReviewQueue,
  buildNotifications,
  buildSessionSummary,
  buildDashboard,
  buildResources,
} from "@/lib/cases/derive";
import type {
  PracticeBundle,
  PracticeMode,
  CaseSubjectSummary,
  CaseSummary,
  TodayPlanBlock,
} from "@/lib/cases/types";

type AnswerRecord = {
  choiceId: string;
  confidence: "low" | "medium" | "high";
  changed: boolean;
  timeSeconds: number;
};

type OnboardingState = {
  active: boolean;
  stepIndex: number;
  goals: {
    examStep: "Step 1" | "Step 2 CK";
    examDate: string;
    targetDailyMinutes: number;
    weeklyAvailability: number;
  };
  baselineResponses: Record<string, { choiceId: string | null; confidence: "low" | "medium" | "high" | null }>;
  completed: boolean;
};

type PracticeState = {
  mode: PracticeMode;
  activeSubjectSlug: string;
  activeCaseSlug: string | null;
  answers: Record<string, AnswerRecord>;
  openDrawers: Record<string, boolean>;
  hintsConsumed: Record<string, number>;
  todayPlanStatus: Record<string, "pending" | "in_progress" | "completed">;
  onboarding: OnboardingState;
};

type Action =
  | { type: "set-mode"; mode: PracticeMode }
  | { type: "set-subject"; subjectSlug: string }
  | { type: "select-case"; caseSlug: string | null }
  | { type: "record-answer"; caseSlug: string; choiceId: string; confidence: "low" | "medium" | "high"; timeSeconds: number }
  | { type: "toggle-drawer"; drawer: string }
  | { type: "consume-hint"; hintId: string }
  | { type: "set-plan-status"; itemId: string; status: "pending" | "in_progress" | "completed" }
  | { type: "start-onboarding" }
  | { type: "dismiss-onboarding" }
  | { type: "set-onboarding-step"; step: number }
  | { type: "update-goal"; patch: Partial<OnboardingState["goals"]> }
  | { type: "record-baseline"; itemId: string; choiceId?: string | null; confidence?: "low" | "medium" | "high" | null }
  | { type: "complete-onboarding" };

export interface PracticeContextValue {
  bundle: PracticeBundle;
  state: PracticeState;
  setMode: (mode: PracticeMode) => void;
  setActiveSubject: (subjectSlug: string) => void;
  selectCase: (caseSlug: string | null) => void;
  recordAnswer: (caseSlug: string, choiceId: string, confidence: "low" | "medium" | "high", timeSeconds: number) => void;
  toggleDrawer: (drawer: string) => void;
  consumeHint: (hintId: string) => void;
  setPlanStatus: (itemId: string, status: "pending" | "in_progress" | "completed") => void;
  startOnboarding: () => void;
  dismissOnboarding: () => void;
  setOnboardingStep: (step: number) => void;
  updateGoals: (patch: Partial<OnboardingState["goals"]>) => void;
  recordBaselineResponse: (itemId: string, choiceId?: string | null, confidence?: "low" | "medium" | "high" | null) => void;
  completeOnboarding: () => void;
}

const PracticeContext = createContext<PracticeContextValue | null>(null);

const buildInitialPlanStatus = (plan: TodayPlanBlock[]) => {
  const status: Record<string, "pending" | "in_progress" | "completed"> = {};
  for (const block of plan) {
    for (const item of block.items) {
      status[item.id] = item.status;
    }
  }
  return status;
};

const buildDefaultOnboarding = (bundle: PracticeBundle): OnboardingState => {
  const defaultExam = bundle.collection.name.toLowerCase().includes("step 2") ? "Step 2 CK" : "Step 1";
  return {
    active: true,
    stepIndex: 0,
    goals: {
      examStep: defaultExam as "Step 1" | "Step 2 CK",
      examDate: new Date().toISOString().slice(0, 10),
      targetDailyMinutes: bundle.user.targetDailyMinutes ?? 90,
      weeklyAvailability: bundle.user.weeklyAvailability ?? 5,
    },
    baselineResponses: {},
    completed: false,
  };
};

const deriveSubjectCases = (bundle: PracticeBundle, subjectSlug: string): { subject: CaseSubjectSummary; cases: CaseSummary[] } => {
  const subject = bundle.subjects.find((s) => s.slug === subjectSlug) ?? bundle.subjects[0] ?? {
    slug: subjectSlug,
    name: subjectSlug,
    description: "",
    position: 0,
    metadata: null,
    caseCount: bundle.cases.length,
  };
  const cases = bundle.cases.filter((c) => c.subjectSlug === subject.slug);
  return { subject, cases };
};

export function PracticeProvider({ bundle, children }: { bundle: PracticeBundle; children: React.ReactNode }) {
  const initialSubjectSlug = bundle.activeSubject?.slug ?? bundle.subjects[0]?.slug ?? "general";
  const { subject: initialSubject, cases: initialCases } = deriveSubjectCases(bundle, initialSubjectSlug);
  const initialPlan = buildTodayPlan(initialSubject, initialCases);

  const initialState: PracticeState = {
    mode: bundle.user.preferredMode,
    activeSubjectSlug: initialSubject.slug,
    activeCaseSlug: initialCases[0]?.slug ?? null,
    answers: {},
    openDrawers: {},
    hintsConsumed: {},
    todayPlanStatus: buildInitialPlanStatus(initialPlan),
    onboarding: buildDefaultOnboarding(bundle),
  };

  const reducer = (state: PracticeState, action: Action): PracticeState => {
    switch (action.type) {
      case "set-mode":
        return { ...state, mode: action.mode };
      case "set-subject": {
        const { subject, cases } = deriveSubjectCases(bundle, action.subjectSlug);
        const nextPlan = buildTodayPlan(subject, cases);
        return {
          ...state,
          activeSubjectSlug: subject.slug,
          activeCaseSlug: cases[0]?.slug ?? null,
          todayPlanStatus: buildInitialPlanStatus(nextPlan),
        };
      }
      case "select-case":
        return { ...state, activeCaseSlug: action.caseSlug };
      case "record-answer": {
        const prev = state.answers[action.caseSlug];
        const changed = prev ? prev.choiceId !== action.choiceId : false;
        return {
          ...state,
          answers: {
            ...state.answers,
            [action.caseSlug]: {
              choiceId: action.choiceId,
              confidence: action.confidence,
              changed,
              timeSeconds: action.timeSeconds,
            },
          },
        };
      }
      case "toggle-drawer":
        return {
          ...state,
          openDrawers: {
            ...state.openDrawers,
            [action.drawer]: !state.openDrawers[action.drawer],
          },
        };
      case "consume-hint":
        return {
          ...state,
          hintsConsumed: {
            ...state.hintsConsumed,
            [action.hintId]: (state.hintsConsumed[action.hintId] || 0) + 1,
          },
        };
      case "set-plan-status":
        return {
          ...state,
          todayPlanStatus: {
            ...state.todayPlanStatus,
            [action.itemId]: action.status,
          },
        };
      case "start-onboarding":
        return { ...state, onboarding: { ...state.onboarding, active: true, stepIndex: 0, completed: false } };
      case "dismiss-onboarding":
        return { ...state, onboarding: { ...state.onboarding, active: false } };
      case "set-onboarding-step":
        return { ...state, onboarding: { ...state.onboarding, stepIndex: action.step } };
      case "update-goal":
        return { ...state, onboarding: { ...state.onboarding, goals: { ...state.onboarding.goals, ...action.patch } } };
      case "record-baseline": {
        const current = state.onboarding.baselineResponses[action.itemId] || { choiceId: null, confidence: null };
        return {
          ...state,
          onboarding: {
            ...state.onboarding,
            baselineResponses: {
              ...state.onboarding.baselineResponses,
              [action.itemId]: {
                choiceId: action.choiceId ?? current.choiceId,
                confidence: action.confidence ?? current.confidence,
              },
            },
          },
        };
      }
      case "complete-onboarding":
        return { ...state, onboarding: { ...state.onboarding, active: false, completed: true } };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const derivedBundle = useMemo(() => {
    const { subject, cases } = deriveSubjectCases(bundle, state.activeSubjectSlug);
    const todayPlan = buildTodayPlan(subject, cases);
    const completedMinutes = todayPlan.reduce((acc, block) => {
      return (
        acc +
        block.items.reduce((sum, item) => {
          const status = state.todayPlanStatus[item.id];
          return sum + (status === "completed" ? item.durationMinutes : 0);
        }, 0)
      );
    }, 0);
    const paceStatus = buildPaceStatus(todayPlan, completedMinutes);
    const weaknessNudges = buildWeaknessNudges(subject, cases);
    const now = new Date();
    const iso = (offset: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      return d.toISOString();
    };
    const reviewQueue = buildReviewQueue(subject, cases, iso);
    const notifications = buildNotifications(bundle.collection.slug, subject, cases, iso);
    const sessionSummary = buildSessionSummary(subject, cases);
    const dashboard = buildDashboard(subject, bundle.cases);
    const resources = buildResources(cases);

    return {
      ...bundle,
      activeSubject: subject,
      todayPlan,
      paceStatus,
      weaknessNudges,
      reviewQueue,
      notifications,
      sessionSummary,
      dashboard,
      resources,
    } satisfies PracticeBundle;
  }, [bundle, state.activeSubjectSlug, state.todayPlanStatus]);

  const value = useMemo<PracticeContextValue>(
    () => ({
      bundle: derivedBundle,
      state,
      setMode: (mode) => dispatch({ type: "set-mode", mode }),
      setActiveSubject: (subjectSlug) => dispatch({ type: "set-subject", subjectSlug }),
      selectCase: (caseSlug) => dispatch({ type: "select-case", caseSlug }),
      recordAnswer: (caseSlug, choiceId, confidence, timeSeconds) =>
        dispatch({ type: "record-answer", caseSlug, choiceId, confidence, timeSeconds }),
      toggleDrawer: (drawer) => dispatch({ type: "toggle-drawer", drawer }),
      consumeHint: (hintId) => dispatch({ type: "consume-hint", hintId }),
      setPlanStatus: (itemId, status) => dispatch({ type: "set-plan-status", itemId, status }),
      startOnboarding: () => dispatch({ type: "start-onboarding" }),
      dismissOnboarding: () => dispatch({ type: "dismiss-onboarding" }),
      setOnboardingStep: (step) => dispatch({ type: "set-onboarding-step", step }),
      updateGoals: (patch) => dispatch({ type: "update-goal", patch }),
      recordBaselineResponse: (itemId, choiceId, confidence) =>
        dispatch({ type: "record-baseline", itemId, choiceId, confidence }),
      completeOnboarding: () => dispatch({ type: "complete-onboarding" }),
    }),
    [derivedBundle, state]
  );

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>;
}

export function usePractice() {
  const ctx = useContext(PracticeContext);
  if (!ctx) throw new Error("usePractice must be used within PracticeProvider");
  return ctx;
}
