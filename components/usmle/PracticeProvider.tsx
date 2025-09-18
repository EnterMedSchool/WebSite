"use client";

import { createContext, useContext, useMemo, useReducer } from "react";
import type { PracticeBundle, PracticeMode } from "@/lib/usmle/types";

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
  activeCaseId: string | null;
  answers: Record<string, AnswerRecord>;
  openDrawers: Record<string, boolean>;
  hintsConsumed: Record<string, number>;
  todayPlanStatus: Record<string, "pending" | "in_progress" | "completed">;
  onboarding: OnboardingState;
};

type Action =
  | { type: "set-mode"; mode: PracticeMode }
  | { type: "select-case"; caseId: string | null }
  | { type: "record-answer"; caseId: string; choiceId: string; confidence: "low" | "medium" | "high"; timeSeconds: number }
  | { type: "toggle-drawer"; drawer: string }
  | { type: "consume-hint"; hintId: string }
  | { type: "set-plan-status"; itemId: string; status: "pending" | "in_progress" | "completed" }
  | { type: "start-onboarding" }
  | { type: "dismiss-onboarding" }
  | { type: "set-onboarding-step"; step: number }
  | { type: "update-goal"; patch: Partial<OnboardingState["goals"]> }
  | { type: "record-baseline"; itemId: string; choiceId?: string | null; confidence?: "low" | "medium" | "high" | null }
  | { type: "complete-onboarding" };

function reducer(state: PracticeState, action: Action): PracticeState {
  switch (action.type) {
    case "set-mode":
      return { ...state, mode: action.mode };
    case "select-case":
      return { ...state, activeCaseId: action.caseId };
    case "record-answer": {
      const prev = state.answers[action.caseId];
      const changed = prev ? prev.choiceId !== action.choiceId : false;
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.caseId]: {
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
      return {
        ...state,
        onboarding: { ...state.onboarding, active: true, stepIndex: 0, completed: false },
      };
    case "dismiss-onboarding":
      return {
        ...state,
        onboarding: { ...state.onboarding, active: false },
      };
    case "set-onboarding-step":
      return {
        ...state,
        onboarding: { ...state.onboarding, stepIndex: action.step },
      };
    case "update-goal":
      return {
        ...state,
        onboarding: {
          ...state.onboarding,
          goals: { ...state.onboarding.goals, ...action.patch },
        },
      };
    case "record-baseline": {
      const prev = state.onboarding.baselineResponses[action.itemId] || { choiceId: null, confidence: null };
      return {
        ...state,
        onboarding: {
          ...state.onboarding,
          baselineResponses: {
            ...state.onboarding.baselineResponses,
            [action.itemId]: {
              choiceId: action.choiceId ?? prev.choiceId,
              confidence: action.confidence ?? prev.confidence,
            },
          },
        },
      };
    }
    case "complete-onboarding":
      return {
        ...state,
        onboarding: { ...state.onboarding, active: false, completed: true },
      };
    default:
      return state;
  }
}

export interface PracticeContextValue {
  bundle: PracticeBundle;
  state: PracticeState;
  setMode: (mode: PracticeMode) => void;
  selectCase: (caseId: string | null) => void;
  recordAnswer: (caseId: string, choiceId: string, confidence: "low" | "medium" | "high", timeSeconds: number) => void;
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

const buildInitialPlanStatus = (bundle: PracticeBundle) => {
  const status: PracticeState["todayPlanStatus"] = {};
  for (const block of bundle.todayPlan) {
    for (const item of block.items) {
      status[item.id] = item.status;
    }
  }
  return status;
};

const defaultOnboarding: OnboardingState = {
  active: true,
  stepIndex: 0,
  goals: {
    examStep: "Step 1",
    examDate: new Date().toISOString().slice(0, 10),
    targetDailyMinutes: 90,
    weeklyAvailability: 5,
  },
  baselineResponses: {},
  completed: false,
};

export function PracticeProvider({ bundle, children }: { bundle: PracticeBundle; children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, bundle, (b) => ({
    mode: b.user.preferredMode,
    activeCaseId: null,
    answers: {},
    openDrawers: {},
    hintsConsumed: {},
    todayPlanStatus: buildInitialPlanStatus(b),
    onboarding: defaultOnboarding,
  }));

  const value = useMemo<PracticeContextValue>(
    () => ({
      bundle,
      state,
      setMode: (mode) => dispatch({ type: "set-mode", mode }),
      selectCase: (caseId) => dispatch({ type: "select-case", caseId }),
      recordAnswer: (caseId, choiceId, confidence, timeSeconds) =>
        dispatch({ type: "record-answer", caseId, choiceId, confidence, timeSeconds }),
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
    [bundle, state],
  );

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>;
}

export function usePractice() {
  const ctx = useContext(PracticeContext);
  if (!ctx) throw new Error("usePractice must be used within PracticeProvider");
  return ctx;
}
