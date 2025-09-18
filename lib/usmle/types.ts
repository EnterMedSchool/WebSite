export type PracticeMode = "study" | "exam" | "adaptive" | "rapid" | "custom";

export type CaseStepKind =
  | "presentation"
  | "history"
  | "exam"
  | "labs"
  | "studies"
  | "question";

export interface CaseContentBlock {
  title: string;
  body: string;
  highlights?: string[];
  image?: {
    src: string;
    alt: string;
    focusRect?: { x: number; y: number; width: number; height: number };
  };
  meta?: Record<string, string>;
  expandable?: boolean;
}

export interface LabValue {
  id: string;
  name: string;
  value: string;
  unit?: string;
  reference?: string;
  flag?: "low" | "high" | null;
}

export interface OrderableTestOption {
  id: string;
  name: string;
  cost: "low" | "moderate" | "high";
  durationMinutes: number;
  yieldScore: number;
  rationale: string;
}

export interface CaseChoice {
  id: string;
  label: string;
  text: string;
  rationale: string;
}

export interface CaseQuestion {
  prompt: string;
  choices: CaseChoice[];
  answerId: string;
  metadata?: {
    task: string;
    timeBudgetSeconds: number;
  };
}

export type HintTier = "clue" | "process" | "knowledge";

export interface CaseHint {
  id: string;
  tier: HintTier;
  title: string;
  description: string;
  masteryCost: number;
}

export interface ReasoningNode {
  id: string;
  label: string;
  detail: string;
  supportingEvidence: string[];
  children?: ReasoningNode[];
}

export interface BiasTag {
  id: string;
  label: string;
  description: string;
}

export interface DebriefArtifact {
  id: string;
  type: "flashcard" | "flowchart" | "variant";
  title: string;
  body: string;
  media?: { src: string; alt: string };
}

export interface CaseResourceLink {
  id: string;
  label: string;
  href: string;
  description?: string;
  timestamp?: string;
}

export interface ClinicalCase {
  id: string;
  title: string;
  subtitle: string;
  system: string;
  discipline: string;
  physicianTasks: string[];
  skills: string[];
  difficulty: "easy" | "moderate" | "hard" | "experimental";
  format: "single" | "multi-step";
  estimatedMinutes: number;
  steps: CaseContentBlock[];
  labs: LabValue[];
  orderableTests: OrderableTestOption[];
  question: CaseQuestion;
  hints: CaseHint[];
  reasoningMap: ReasoningNode;
  biasTags: BiasTag[];
  artifacts: DebriefArtifact[];
  resources: CaseResourceLink[];
}

export interface ConfidenceSnapshot {
  caseId: string;
  confidence: "low" | "medium" | "high";
  correct: boolean;
  timeSeconds: number;
}

export interface TodayPlanBlock {
  id: string;
  label: string;
  description: string;
  items: Array<{
    id: string;
    type: "warmup" | "case" | "review";
    title: string;
    durationMinutes: number;
    status: "pending" | "in_progress" | "completed";
  }>;
}

export interface PaceStatus {
  plannedMinutes: number;
  completedMinutes: number;
  pace: "ahead" | "on_target" | "behind";
}

export interface WeaknessNudge {
  id: string;
  message: string;
  systems: string[];
  recommendedCases: string[];
}

export interface ReviewQueueItem {
  id: string;
  caseId: string;
  due: string;
  mode: "recall" | "re-case" | "variant";
  urgency: "overdue" | "today" | "tomorrow" | "this_week";
  suspended?: boolean;
}

export interface ReviewQueueState {
  due: ReviewQueueItem[];
  upcoming: ReviewQueueItem[];
  suspended: ReviewQueueItem[];
}

export interface BlueprintHeatmapCell {
  system: string;
  discipline: string;
  value: number;
}

export interface ErrorFingerprint {
  knowledge: number;
  dataInterpretation: number;
  prematureClosure: number;
  math: number;
  imaging: number;
  timePressure: number;
}

export interface SessionSummaryData {
  sessionId: string;
  accuracy: number;
  averageTimeSeconds: number;
  confidenceCurve: Array<{ confidence: "low" | "medium" | "high"; correct: number; total: number }>;
  heatmap: BlueprintHeatmapCell[];
  errorFingerprint: ErrorFingerprint;
  paceReport: Array<{ caseId: string; timeSeconds: number; budgetSeconds: number }>;
  peerPercentile?: number;
}

export interface DashboardMetric<T = number> {
  id: string;
  label: string;
  description: string;
  value: T;
  trend?: Array<{ date: string; value: T }>;
}

export interface DashboardData {
  masteryTrend: Array<{ date: string; value: number }>;
  streak: number;
  minutes: DashboardMetric;
  examReadiness: DashboardMetric;
  coverageHeatmap: BlueprintHeatmapCell[];
  biggestMovers: Array<{ area: string; delta: number }>;
  biasMonitor: Array<{ label: string; impact: string }>;
  timeBudget: DashboardMetric;
  imageSkills: DashboardMetric;
  studyQuality: DashboardMetric;
  resourceLeverage: Array<{ resource: string; effect: string }>;
  insights: string[];
}

export interface PracticeNotification {
  id: string;
  message: string;
  detail?: string;
  actionLabel?: string;
  actionHref?: string;
  scheduledFor: string;
}

export interface PracticeBundle {
  user: {
    id: number;
    name: string;
    examDate: string;
    targetDailyMinutes: number;
    weeklyAvailability: number;
    preferredMode: PracticeMode;
  };
  todayPlan: TodayPlanBlock[];
  paceStatus: PaceStatus;
  weaknessNudges: WeaknessNudge[];
  modes: PracticeMode[];
  cases: ClinicalCase[];
  reviewQueue: ReviewQueueState;
  sessionSummary: SessionSummaryData;
  dashboard: DashboardData;
  notifications: PracticeNotification[];
  resources: Array<{
    id: string;
    category: "algorithm" | "one-pager" | "atlas";
    title: string;
    description: string;
    media?: { src: string; alt: string };
  }>;
}
