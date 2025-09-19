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
  CaseAttemptRecord,
} from "@/lib/cases/types";

export type SessionFilters = {
  systems: string[];
  disciplines: string[];
  tasks: string[];
  skills: string[];
  difficulty: string[];
};

export type SessionAids = {
  hints: boolean;
  ruleOut: boolean;
  labRef: boolean;
  calculator: boolean;
};

export interface SessionDraft {
  title?: string;
  mode: PracticeMode;
  caseSlugs: string[];
  timeBox: number | null;
  aids: SessionAids;
  filters: SessionFilters;
}

export interface ActiveSession extends SessionDraft {
  id: string;
  createdAt: number;
  cursor: number;
  completedSlugs: string[];
  status: "active" | "completed";
  completedAt?: number;
}

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
  activeSession: ActiveSession | null;
  history: CaseAttemptRecord[];
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
  | { type: "complete-onboarding" }
  | { type: "start-session"; session: ActiveSession }
  | { type: "advance-session"; completedSlug?: string | null }
  | { type: "end-session" }
  | { type: "append-attempt"; attempt: CaseAttemptRecord };

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
  startSession: (draft: SessionDraft) => void;
  advanceSession: (completedSlug?: string | null) => void;
  endSession: () => void;
  recordAttempt: (attempt: CaseAttemptRecord) => void;
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

const generateSessionId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
  const initialSubjectAttempts = bundle.history.filter((attempt) => attempt.subjectSlug === initialSubject.slug);
  const initialPlan = buildTodayPlan(initialSubject, initialCases, initialSubjectAttempts);

  const initialState: PracticeState = {
    mode: bundle.user.preferredMode,
    activeSubjectSlug: initialSubject.slug,
    activeCaseSlug: initialCases[0]?.slug ?? null,
    answers: {},
    openDrawers: {},
    hintsConsumed: {},
    todayPlanStatus: buildInitialPlanStatus(initialPlan),
    onboarding: buildDefaultOnboarding(bundle),
    activeSession: null,
    history: bundle.history ?? [],
  };

  const reducer = (state: PracticeState, action: Action): PracticeState => {
    switch (action.type) {
      case "set-mode":
        return { ...state, mode: action.mode };
      case "set-subject": {
        const { subject, cases } = deriveSubjectCases(bundle, action.subjectSlug);
        const subjectAttempts = state.history.filter((attempt) => attempt.subjectSlug === subject.slug);
        const nextPlan = buildTodayPlan(subject, cases, subjectAttempts);
        return {
          ...state,
          activeSubjectSlug: subject.slug,
          activeCaseSlug: cases[0]?.slug ?? null,
          todayPlanStatus: buildInitialPlanStatus(nextPlan),
          activeSession: null,
        };
      }
      case "select-case": {
        if (!state.activeSession || !action.caseSlug) {
          return { ...state, activeCaseSlug: action.caseSlug };
        }
        const idx = state.activeSession.caseSlugs.indexOf(action.caseSlug);
        if (idx === -1 || idx === state.activeSession.cursor) {
          return { ...state, activeCaseSlug: action.caseSlug };
        }
        return {
          ...state,
          activeCaseSlug: action.caseSlug,
          activeSession: {
            ...state.activeSession,
            cursor: idx,
          },
        };
      }
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
      case "start-session": {
        const firstSlug = action.session.caseSlugs[0] ?? null;
        return {
          ...state,
          mode: action.session.mode,
          activeSession: action.session,
          activeCaseSlug: firstSlug,
        };
      }
      case "advance-session": {
        if (!state.activeSession) return state;
        const currentIndex = state.activeSession.cursor;
        const currentSlug = state.activeSession.caseSlugs[currentIndex] ?? null;
        const completed = new Set(state.activeSession.completedSlugs);
        if (currentSlug) {
          completed.add(currentSlug);
        }
        if (action.completedSlug) {
          completed.add(action.completedSlug);
        }
        const nextIndex = currentIndex + 1;
        const isDone = nextIndex >= state.activeSession.caseSlugs.length;
        const cursor = isDone ? Math.max(0, state.activeSession.caseSlugs.length - 1) : nextIndex;
        const nextSlug = isDone ? currentSlug : state.activeSession.caseSlugs[nextIndex];
        return {
          ...state,
          activeSession: {
            ...state.activeSession,
            cursor,
            completedSlugs: Array.from(completed),
            status: isDone ? "completed" : "active",
            completedAt: isDone ? Date.now() : state.activeSession.completedAt,
          },
          activeCaseSlug: nextSlug,
        };
      }
      case "end-session": {
        if (!state.activeSession) return state;
        return {
          ...state,
          activeSession: null,
        };
      }
      case "append-attempt": {
        const filtered = state.history.filter((item) => item.id !== action.attempt.id);
        return {
          ...state,
          history: [action.attempt, ...filtered].slice(0, 400),
        };
      }
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const derivedBundle = useMemo(() => {
    const { subject, cases } = deriveSubjectCases(bundle, state.activeSubjectSlug);
    const subjectAttempts = state.history.filter((attempt) => attempt.subjectSlug === subject.slug);
    const todayPlan = buildTodayPlan(subject, cases, subjectAttempts);
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
    const weaknessNudges = buildWeaknessNudges(subject, cases, subjectAttempts);
    const now = new Date();
    const iso = (offset: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      return d.toISOString();
    };
    const reviewQueue = buildReviewQueue(subject, cases, subjectAttempts, iso);
    const notifications = buildNotifications(bundle.collection.slug, subject, cases, subjectAttempts, iso);
    const sessionSummary = buildSessionSummary(subject, cases, subjectAttempts);
    const dashboard = buildDashboard(subject, bundle.cases, state.history);
    const resources = buildResources(cases, subjectAttempts);

    return {
      ...bundle,
      history: state.history.map((item) => ({ ...item })),
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
  }, [bundle, state.activeSubjectSlug, state.todayPlanStatus, state.history]);

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
      startSession: (draft) => {
        if (!draft.caseSlugs.length) return;
        const session: ActiveSession = {
          ...draft,
          id: generateSessionId(),
          createdAt: Date.now(),
          cursor: 0,
          completedSlugs: [],
          status: "active",
        };
        dispatch({ type: "start-session", session });
      },
      advanceSession: (completedSlug) => dispatch({ type: "advance-session", completedSlug: completedSlug ?? null }),
      endSession: () => dispatch({ type: "end-session" }),
      recordAttempt: (attempt) => dispatch({ type: "append-attempt", attempt }),
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
