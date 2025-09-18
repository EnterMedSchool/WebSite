import type {
  CaseSubjectSummary,
  CaseSummary,
  TodayPlanBlock,
  PaceStatus,
  WeaknessNudge,
  ReviewQueueState,
  PracticeNotification,
  SessionSummaryData,
  DashboardData,
} from "@/lib/cases/types";

export function buildTodayPlan(subject: CaseSubjectSummary, cases: CaseSummary[]): TodayPlanBlock[] {
  const caseItems = cases.slice(0, 2).map((c) => ({
    id: c.slug,
    type: "case" as const,
    title: c.title,
    durationMinutes: c.estimatedMinutes,
    status: "pending" as const,
  }));

  return [
    {
      id: "block-warmup",
      label: "Warm-up",
      description: `Prime reasoning pathways before tackling ${subject.name}.`,
      items: [
        {
          id: "warmup-1",
          type: "warmup" as const,
          title: `${subject.name} quick recall cards`,
          durationMinutes: 5,
          status: "pending" as const,
        },
        {
          id: "warmup-2",
          type: "warmup" as const,
          title: "Bias awareness micro-drill",
          durationMinutes: 5,
          status: "pending" as const,
        },
      ],
    },
    {
      id: "block-cases",
      label: "Clinical cases",
      description: `${subject.name} cases selected for your current gaps.`,
      items: caseItems,
    },
    {
      id: "block-review",
      label: "Spaced review",
      description: "Keep recent algorithms fresh with quick recall reps.",
      items: [
        {
          id: "review-1",
          type: "review" as const,
          title: `${subject.name} algorithm flash review`,
          durationMinutes: 6,
          status: "pending" as const,
        },
      ],
    },
  ];
}

export function buildPaceStatus(plan: TodayPlanBlock[], completedMinutes = 0): PaceStatus {
  const plannedMinutes = plan.reduce((acc, block) => acc + block.items.reduce((sum, item) => sum + item.durationMinutes, 0), 0);
  const pace: PaceStatus["pace"] = completedMinutes >= plannedMinutes ? "ahead" : completedMinutes === 0 ? "behind" : "on_target";
  return {
    plannedMinutes,
    completedMinutes,
    pace,
  };
}

export function buildWeaknessNudges(subject: CaseSubjectSummary, cases: CaseSummary[]): WeaknessNudge[] {
  if (!cases.length) return [];
  return [
    {
      id: `nudge-${subject.slug}`,
      message: `${subject.name} needs deliberate reps - ${cases.length} cases queued.`,
      systems: [subject.name],
      recommendedCases: cases.slice(0, 2).map((c) => c.slug),
    },
  ];
}

export function buildReviewQueue(subject: CaseSubjectSummary, cases: CaseSummary[], iso: (offset: number) => string): ReviewQueueState {
  return {
    due: cases.slice(0, 2).map((c, idx) => ({
      id: `due-${subject.slug}-${c.slug}`,
      caseSlug: c.slug,
      due: iso(idx),
      mode: idx % 2 === 0 ? "recall" : "re-case",
      urgency: idx === 0 ? "today" : "tomorrow",
    })),
    upcoming: cases.slice(2, 4).map((c, idx) => ({
      id: `upcoming-${subject.slug}-${c.slug}`,
      caseSlug: c.slug,
      due: iso(idx + 2),
      mode: "variant",
      urgency: "this_week",
    })),
    suspended: [],
  };
}

export function buildNotifications(collectionSlug: string, subject: CaseSubjectSummary, cases: CaseSummary[], iso: (offset: number) => string): PracticeNotification[] {
  return [
    {
      id: `notif-due-${subject.slug}`,
      message: `${subject.name} reviews due - 5 minutes total.`,
      detail: "Finish short recall reps to keep your streak alive.",
      actionLabel: "Open review queue",
      actionHref: `/cases/${collectionSlug}/review`,
      scheduledFor: iso(0),
    },
    {
      id: `notif-focus-${subject.slug}`,
      message: `${subject.name} cases emphasise ${subject.name.toLowerCase()} decision rules today.`,
      actionLabel: "Start guided case",
      actionHref: `/cases/${collectionSlug}/practice/${cases[0]?.slug ?? ""}`,
      scheduledFor: iso(0),
    },
  ];
}

export function buildSessionSummary(subject: CaseSubjectSummary, cases: CaseSummary[]): SessionSummaryData {
  return {
    sessionId: `session-${subject.slug}`,
    accuracy: 0.72,
    averageTimeSeconds: 150,
    confidenceCurve: [
      { confidence: "low", correct: 3, total: 5 },
      { confidence: "medium", correct: 5, total: 7 },
      { confidence: "high", correct: 6, total: 8 },
    ],
    heatmap: cases.slice(0, 4).map((c) => ({
      system: subject.name,
      discipline: "Clinical reasoning",
      value: 0.5,
    })),
    errorFingerprint: {
      knowledge: 0.35,
      dataInterpretation: 0.55,
      prematureClosure: 0.25,
      math: 0.2,
      imaging: 0.4,
      timePressure: 0.45,
    },
    paceReport: cases.slice(0, 2).map((c) => ({
      caseSlug: c.slug,
      timeSeconds: Math.round(c.estimatedMinutes * 60 * 1.1),
      budgetSeconds: Math.round(c.estimatedMinutes * 60),
    })),
    peerPercentile: 70,
  };
}

export function buildDashboard(subject: CaseSubjectSummary, cases: CaseSummary[]): DashboardData {
  const now = new Date();
  const trend = Array.from({ length: 4 }).map((_, idx) => ({
    date: new Date(now.getTime() - (3 - idx) * 86400000).toISOString(),
    value: 45 + idx * 5,
  }));
  return {
    masteryTrend: trend,
    streak: 9,
    minutes: {
      id: "minutes",
      label: "Minutes practised (7d)",
      description: "Total focused minutes logged this week.",
      value: 410,
      trend,
    },
    examReadiness: {
      id: "readiness",
      label: "Exam readiness",
      description: "Composite of coverage, calibration, and pace.",
      value: 68,
    },
    coverageHeatmap: cases.slice(0, 6).map((c) => ({
      system: subject.name,
      discipline: "Clinical reasoning",
      value: 0.5,
    })),
    biggestMovers: [
      { area: `${subject.name} algorithms`, delta: 12 },
      { area: "Bias awareness", delta: -6 },
    ],
    biasMonitor: [
      { label: "Answer switches", impact: "Late switches reduce accuracy by 8%" },
      { label: "Time pressure", impact: "Sub-30 second decisions drop accuracy by 12%" },
    ],
    timeBudget: {
      id: "time-budget",
      label: "Median time per item",
      description: "Compare to your 90 second goal",
      value: 104,
    },
    imageSkills: {
      id: "image-skills",
      label: "Image interpretation",
      description: `% correct this month across imaging findings for ${subject.name}.`,
      value: 71,
    },
    studyQuality: {
      id: "study-quality",
      label: "Study quality",
      description: "Active days x average session length x review completion %",
      value: 78,
    },
    resourceLeverage: [
      { resource: `${subject.name} algorithm video`, effect: "+18% accuracy next day" },
      { resource: "Bias micro-drill", effect: "Reduces premature closure by 10%" },
    ],
    insights: [
      `${subject.name} accuracy improves 24h after watching targeted clips - schedule two micro videos after cases.`,
      "Mark low confidence and take a 30 second pause to cut premature closure by 10%.",
    ],
  };
}

export function buildResources(cases: CaseSummary[]) {
  const resources = new Map<string, { id: string; category: "algorithm" | "one-pager" | "atlas"; title: string; description: string; media?: { src: string; alt: string } }>();
  for (const c of cases) {
    resources.set(`algorithm-${c.slug}`, {
      id: `algorithm-${c.slug}`,
      category: "algorithm",
      title: `${c.title} flowchart`,
      description: "Flowchart template to capture discriminators after each case.",
    });
  }
  if (!resources.has("default-algorithm")) {
    resources.set("default-algorithm", {
      id: "default-algorithm",
      category: "algorithm",
      title: "Diagnostic ladder template",
      description: "Reusable scaffold to sketch reasoning paths.",
    });
  }
  resources.set("default-onepager", {
    id: "default-onepager",
    category: "one-pager",
    title: "Bias buster checklist",
    description: "Quick checklist to avoid anchoring, confirmation bias, and premature closure during cases.",
  });
  resources.set("default-atlas", {
    id: "default-atlas",
    category: "atlas",
    title: "Imaging pearls",
    description: "High-yield imaging findings linked from recent cases.",
    media: { src: "/images/resources/imaging-pearl.png", alt: "Imaging pearls preview" },
  });
  return Array.from(resources.values());
}
