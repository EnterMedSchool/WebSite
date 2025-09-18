export type PracticeMode = "study" | "exam" | "adaptive" | "rapid" | "custom";

export type StageType = "info" | "decision" | "order" | "diagnosis" | "management" | "summary";

export interface CaseCollectionSummary {
  slug: string;
  name: string;
  description?: string | null;
  accentColor?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface CaseSubjectSummary {
  slug: string;
  name: string;
  description?: string | null;
  position: number;
  metadata?: Record<string, unknown> | null;
  caseCount?: number;
}

export interface CaseSummary {
  id: string;
  dbId: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  overview?: string | null;
  subjectSlug: string;
  subjectName: string;
  difficulty: "easy" | "moderate" | "hard" | "experimental";
  estimatedMinutes: number;
  phaseCount: number;
  stageCount: number;
  entryStageSlug: string;
  managementEntrySlug?: string | null;
  system?: string;
  discipline?: string;
  physicianTasks?: string[];
  skills?: string[];
  format?: "guided" | "branching" | "legacy";
  tags?: string[];
  graph?: CaseGraph;
}

export interface CaseStageOption {
  id: number;
  value: string;
  label: string;
  description?: string | null;
  detail?: string | null;
  isCorrect: boolean;
  advanceTo?: string | null;
  costTime?: number | null;
  scoreDelta?: number | null;
  reveals: string[];
  outcomes?: Record<string, unknown> | null;
}

export interface CaseStage {
  id: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  phase: number;
  stageType: StageType;
  orderIndex: number;
  allowMultiple: boolean;
  isTerminal: boolean;
  info: string[];
  metadata?: Record<string, unknown> | null;
  options: CaseStageOption[];
}

export interface CaseGraph {
  stages: CaseStage[];
  stageMap: Record<string, CaseStage>;
  entryStageSlug: string;
  managementEntrySlug?: string | null;
}

export interface CaseAttemptStep {
  id: number;
  stageSlug: string;
  optionValue: string;
  correct: boolean;
  evidence: string[];
  feedback?: string;
  timeSpent?: number;
  takenAt: string;
}

export interface CaseAttemptState {
  attemptId: number;
  caseId: number;
  status: "in_progress" | "completed";
  phase: number;
  currentStageSlug: string | null;
  score: number;
  evidence: string[];
  timeline: CaseAttemptStep[];
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
  caseSlug: string;
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
  paceReport: Array<{ caseSlug: string; timeSeconds: number; budgetSeconds: number }>;
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
  collection: CaseCollectionSummary;
  availableCollections: CaseCollectionSummary[];
  subjects: CaseSubjectSummary[];
  activeSubject: CaseSubjectSummary;
  cases: CaseSummary[];
  todayPlan: TodayPlanBlock[];
  paceStatus: PaceStatus;
  weaknessNudges: WeaknessNudge[];
  modes: PracticeMode[];
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




