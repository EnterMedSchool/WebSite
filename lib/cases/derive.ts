import type {
  CaseSubjectSummary,
  CaseSummary,
  TodayPlanBlock,
  PaceStatus,
  WeaknessNudge,
  ReviewQueueState,
  ReviewQueueItem,
  PracticeNotification,
  SessionSummaryData,
  DashboardData,
  BlueprintHeatmapCell,
  CaseAttemptRecord,
} from "@/lib/cases/types";

export function buildTodayPlan(subject: CaseSubjectSummary, cases: CaseSummary[], attempts: CaseAttemptRecord[]): TodayPlanBlock[] {
  const sortedAttempts = [...attempts].sort((a, b) => {
    const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return bTime - aTime;
  });
  const latestByCase = new Map<string, CaseAttemptRecord>();
  for (const attempt of sortedAttempts) {
    if (!latestByCase.has(attempt.caseSlug)) {
      latestByCase.set(attempt.caseSlug, attempt);
    }
  }

  const prioritized = cases.map((caseSummary) => {
    const latest = latestByCase.get(caseSummary.slug) ?? null;
    const lastCompletedAt = latest?.completedAt ? new Date(latest.completedAt).getTime() : 0;
    const accuracy = latest ? latest.correctActions / Math.max(latest.totalActions, 1) : null;
    const mistakes = latest?.mistakes ?? 0;
    return { caseSummary, latest, lastCompletedAt, accuracy, mistakes };
  });

  prioritized.sort((a, b) => {
    if (!a.latest && b.latest) return -1;
    if (!b.latest && a.latest) return 1;
    if (!a.latest && !b.latest) return a.caseSummary.title.localeCompare(b.caseSummary.title);
    if ((a.accuracy ?? 1) !== (b.accuracy ?? 1)) return (a.accuracy ?? 1) - (b.accuracy ?? 1);
    return a.lastCompletedAt - b.lastCompletedAt;
  });

  const targetedCases = prioritized.slice(0, Math.min(3, prioritized.length));

  const warmupBlock: TodayPlanBlock = {
    id: `warmup-${subject.slug}`,
    label: "Warm-up",
    description: `Prime your ${subject.name.toLowerCase()} approach before the main cases.`,
    items: [
      {
        id: `warmup-${subject.slug}-primer`,
        type: "warmup",
        title: `${subject.name} reasoning primer`,
        durationMinutes: 5,
        status: "pending",
      },
    ],
  };

  const caseItems = targetedCases.map(({ caseSummary }) => ({
    id: caseSummary.slug,
    type: "case" as const,
    title: caseSummary.title,
    durationMinutes: caseSummary.estimatedMinutes ?? 15,
    status: "pending" as const,
  }));

  const casesBlock: TodayPlanBlock = {
    id: `cases-${subject.slug}`,
    label: "Clinical cases",
    description: targetedCases.length
      ? "Targeted scenes selected from your recent performance."
      : "Fresh cases to establish your baseline.",
    items: caseItems,
  };

  const reviewCandidates = prioritized.filter(({ mistakes }) => mistakes > 0).slice(0, 2);
  const reviewItems = reviewCandidates.map(({ caseSummary, latest }) => ({
    id: `review-${caseSummary.slug}`,
    type: "review" as const,
    title: `${caseSummary.title} quick revisit`,
    durationMinutes: Math.max(5, Math.min(10, Math.round((latest?.timeSpentSeconds ?? 360) / 60))),
    status: "pending" as const,
  }));

  const reviewBlock: TodayPlanBlock = {
    id: `review-${subject.slug}`,
    label: "Spaced review",
    description: reviewItems.length
      ? "Revisit tricky paths while the memory is fresh."
      : "Lock in core algorithms with a lightweight refresh.",
    items:
      reviewItems.length > 0
        ? reviewItems
        : [
            {
              id: `review-${subject.slug}-fallback`,
              type: "review" as const,
              title: `${subject.name} algorithm flashcards`,
              durationMinutes: 6,
              status: "pending" as const,
            },
          ],
  };

  return [warmupBlock, casesBlock, reviewBlock];
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

export function buildWeaknessNudges(subject: CaseSubjectSummary, cases: CaseSummary[], attempts: CaseAttemptRecord[]): WeaknessNudge[] {
  if (!attempts.length) {
    return [
      {
        id: `nudge-${subject.slug}-start`,
        message: `Run your first ${subject.name.toLowerCase()} case to establish a baseline.`,
        systems: [subject.name],
        recommendedCases: cases.slice(0, 2).map((c) => c.slug),
      },
    ];
  }

  const caseSummaries = cases.map((caseSummary) => {
    const caseAttempts = attempts.filter((attempt) => attempt.caseSlug === caseSummary.slug);
    if (!caseAttempts.length) return null;
    const totalCorrect = caseAttempts.reduce((sum, attempt) => sum + attempt.correctActions, 0);
    const totalActions = caseAttempts.reduce((sum, attempt) => sum + attempt.totalActions, 0);
    const mistakes = caseAttempts.reduce((sum, attempt) => sum + attempt.mistakes, 0);
    return {
      caseSummary,
      accuracy: totalCorrect / Math.max(totalActions, 1),
      mistakes,
      attempts: caseAttempts.length,
    };
  });

  const ranked = caseSummaries
    .filter((entry): entry is { caseSummary: CaseSummary; accuracy: number; mistakes: number; attempts: number } => entry !== null)
    .sort((a, b) => {
      if (a.accuracy === b.accuracy) return b.mistakes - a.mistakes;
      return a.accuracy - b.accuracy;
    });

  if (!ranked.length) {
    return [
      {
        id: `nudge-${subject.slug}-reinforce`,
        message: `Reinforce ${subject.name.toLowerCase()} algorithms with a fresh focused case.`,
        systems: [subject.name],
        recommendedCases: cases.slice(0, 2).map((c) => c.slug),
      },
    ];
  }

  return ranked.slice(0, Math.min(2, ranked.length)).map(({ caseSummary, accuracy, mistakes }) => ({
    id: `nudge-${subject.slug}-${caseSummary.slug}`,
    message: `${caseSummary.title}: ${Math.round(accuracy * 100)}% accuracy with ${mistakes} missteps. Take another lap.`,
    systems: [caseSummary.system ?? subject.name],
    recommendedCases: [caseSummary.slug],
  }));
}

export function buildReviewQueue(subject: CaseSubjectSummary, cases: CaseSummary[], attempts: CaseAttemptRecord[], iso: (offset: number) => string): ReviewQueueState {
  const scheduled: ReviewQueueItem[] = attempts.map((attempt): ReviewQueueItem => {
    const completedAt = attempt.completedAt ? new Date(attempt.completedAt) : new Date();
    const offsetDays = attempt.mistakes > 0 ? 1 : 3;
    const due = iso(offsetDays);
    const urgency: ReviewQueueItem["urgency"] =
      attempt.mistakes > 0 ? "today" : offsetDays <= 1 ? "tomorrow" : "this_week";
    const mode: ReviewQueueItem["mode"] = attempt.mistakes > 0 ? "re-case" : "recall";
    return {
      id: `review-${attempt.caseSlug}-${completedAt.getTime()}`,
      caseSlug: attempt.caseSlug,
      due,
      mode,
      urgency,
    };
  });

  const due: ReviewQueueItem[] = scheduled.slice(0, 3);
  const upcoming: ReviewQueueItem[] = scheduled.slice(3, 6).map((item): ReviewQueueItem => ({
    ...item,
    mode: "variant",
    urgency: "this_week",
  }));

  return {
    due,
    upcoming,
    suspended: [],
  };
}

export function buildNotifications(collectionSlug: string, subject: CaseSubjectSummary, cases: CaseSummary[], attempts: CaseAttemptRecord[], iso: (offset: number) => string): PracticeNotification[] {
  if (!attempts.length) {
    return [
      {
        id: `notif-${subject.slug}-start`,
        message: `${subject.name} cases are queued for today.`,
        detail: "Kick off with a fresh scenario before noon.",
        actionLabel: "Open first case",
        actionHref: `/cases/${collectionSlug}/practice/${cases[0]?.slug ?? ""}`,
        scheduledFor: iso(0),
      },
    ];
  }

  const dueSoon = attempts.filter((attempt) => attempt.mistakes > 0).length;
  const latest = [...attempts]
    .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    })[0];

  return [
    {
      id: `notif-${subject.slug}-review`,
      message: dueSoon
        ? `${dueSoon} ${dueSoon === 1 ? "case" : "cases"} ready for spaced review.`
        : `Light review day for ${subject.name}.`,
      detail: dueSoon ? "Close the loop on yesterday's missteps." : "Maintain the streak with a quick recap.",
      actionLabel: "Open review queue",
      actionHref: `/cases/${collectionSlug}/review`,
      scheduledFor: iso(0),
    },
    {
      id: `notif-${subject.slug}-focus`,
      message: latest
        ? `${latest.caseSlug} queued to reinforce your algorithm.`
        : `${subject.name} focus block ready.`,
      detail: "Stay calibrated with a targeted run.",
      actionLabel: "Resume practice",
      actionHref: `/cases/${collectionSlug}/practice/${latest?.caseSlug ?? cases[0]?.slug ?? ""}`,
      scheduledFor: iso(0),
    },
  ];
}

export function buildSessionSummary(subject: CaseSubjectSummary, cases: CaseSummary[], attempts: CaseAttemptRecord[]): SessionSummaryData {
  const subjectAttempts = attempts
    .filter((attempt) => attempt.subjectSlug === subject.slug)
    .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    });

  if (!subjectAttempts.length) {
    return {
      sessionId: `session-${subject.slug}-empty`,
      accuracy: 0,
      averageTimeSeconds: 0,
      confidenceCurve: [
        { confidence: "low", correct: 0, total: 0 },
        { confidence: "medium", correct: 0, total: 0 },
        { confidence: "high", correct: 0, total: 0 },
      ],
      heatmap: [],
      errorFingerprint: {
        knowledge: 0.2,
        dataInterpretation: 0.2,
        prematureClosure: 0.2,
        math: 0.1,
        imaging: 0.15,
        timePressure: 0.15,
      },
      paceReport: [],
      peerPercentile: 50,
    };
  }

  const latest = subjectAttempts[0];
  const totalActions = Math.max(latest.totalActions, 1);
  const accuracy = latest.correctActions / totalActions;
  const averageTimeSeconds = latest.timeSpentSeconds / totalActions;

  const lowCorrect = Math.max(0, Math.min(latest.correctActions, Math.round(latest.correctActions * 0.3)));
  const mediumCorrect = Math.max(0, Math.round(latest.correctActions * 0.5));
  const highCorrect = Math.max(0, latest.correctActions - mediumCorrect - lowCorrect);

  const confidenceCurve: SessionSummaryData["confidenceCurve"] = [
    { confidence: "low", correct: lowCorrect, total: Math.max(latest.incorrectActions, 0) },
    { confidence: "medium", correct: mediumCorrect, total: Math.max(totalActions - latest.incorrectActions - lowCorrect, 0) },
    { confidence: "high", correct: highCorrect, total: Math.max(latest.correctActions, 0) },
  ];

  const heatmap = cases
    .filter((caseSummary) => caseSummary.subjectSlug === subject.slug)
    .map((caseSummary) => {
      const caseAttempts = subjectAttempts.filter((attempt) => attempt.caseSlug === caseSummary.slug);
      if (!caseAttempts.length) return null;
      const totalCorrect = caseAttempts.reduce((sum, attempt) => sum + attempt.correctActions, 0);
      const total = caseAttempts.reduce((sum, attempt) => sum + attempt.totalActions, 0);
      return {
        system: caseSummary.system ?? subject.name,
        discipline: caseSummary.discipline ?? "Clinical reasoning",
        value: totalCorrect / Math.max(total, 1),
      };
    })
    .filter((cell): cell is BlueprintHeatmapCell => cell !== null);

  const fingerprintBase = Math.max(latest.mistakes + latest.timeSpentSeconds / 60, 1);
  const errorFingerprint = {
    knowledge: Math.min(1, latest.mistakes / fingerprintBase),
    dataInterpretation: Math.min(1, (latest.mistakes * 0.6) / fingerprintBase),
    prematureClosure: Math.min(1, (latest.mistakes * 0.4) / fingerprintBase),
    math: Math.min(1, 0.1 + latest.mistakes * 0.05),
    imaging: Math.min(1, 0.2 + latest.mistakes * 0.05),
    timePressure: Math.min(1, latest.timeSpentSeconds / (totalActions * 120)),
  };

  const paceReport = subjectAttempts.slice(0, 3).map((attempt) => {
    const caseSummary = cases.find((c) => c.slug === attempt.caseSlug);
    const budgetMinutes = caseSummary?.estimatedMinutes ?? 3;
    return {
      caseSlug: attempt.caseSlug,
      timeSeconds: Math.round(attempt.timeSpentSeconds / Math.max(attempt.totalActions, 1)),
      budgetSeconds: Math.round((budgetMinutes * 60) / Math.max(attempt.totalActions, 1)),
    };
  });

  const peerPercentile = Math.max(10, Math.min(99, Math.round(accuracy * 100)));

  return {
    sessionId: latest.id.toString(),
    accuracy,
    averageTimeSeconds,
    confidenceCurve,
    heatmap,
    errorFingerprint,
    paceReport,
    peerPercentile,
  };
}

export function buildDashboard(subject: CaseSubjectSummary, allCases: CaseSummary[], history: CaseAttemptRecord[]): DashboardData {
  const attempts = history.filter((attempt) => attempt.subjectSlug === subject.slug);
  const now = new Date();

  if (!attempts.length) {
    return {
      masteryTrend: Array.from({ length: 4 }).map((_, idx) => ({
        date: new Date(now.getTime() - (3 - idx) * 86400000).toISOString(),
        value: 0,
      })),
      streak: 0,
      minutes: {
        id: "minutes",
        label: "Minutes practised (7d)",
        description: "Total focused minutes logged this week.",
        value: 0,
        trend: [],
      },
      examReadiness: {
        id: "readiness",
        label: "Exam readiness",
        description: "Composite accuracy across recent attempts.",
        value: 0,
      },
      coverageHeatmap: [],
      biggestMovers: [],
      biasMonitor: [
        { label: "Late switches", impact: "No data yet" },
        { label: "Time pressure", impact: "Log a session to unlock insights" },
      ],
      timeBudget: {
        id: "time-budget",
        label: "Median time per action",
        description: "Compare to your 90 second goal",
        value: 0,
      },
      imageSkills: {
        id: "image-skills",
        label: "Image interpretation",
        description: "Accuracy across cases tagged with imaging skills.",
        value: 0,
      },
      studyQuality: {
        id: "study-quality",
        label: "Study quality",
        description: "Streak length x focus minutes x accuracy",
        value: 0,
      },
      resourceLeverage: [
        { resource: `${subject.name} algorithm review`, effect: "Unlock after your first case" },
      ],
      insights: ["Log a case to start generating personalised analytics."],
    };
  }

  const accuracyTotals = attempts.reduce(
    (agg, attempt) => {
      agg.correct += attempt.correctActions;
      agg.total += attempt.totalActions;
      return agg;
    },
    { correct: 0, total: 0 }
  );
  const overallAccuracy = accuracyTotals.total ? accuracyTotals.correct / accuracyTotals.total : 0;

  const masteryTrend = Array.from({ length: 7 }).map((_, idx) => {
    const day = new Date(now.getTime() - (6 - idx) * 86400000);
    const key = day.toISOString().slice(0, 10);
    const dayAttempts = attempts.filter((attempt) => {
      const completed = attempt.completedAt ? new Date(attempt.completedAt) : null;
      if (!completed) return false;
      return completed.toISOString().slice(0, 10) === key;
    });
    const dayTotals = dayAttempts.reduce(
      (agg, attempt) => {
        agg.correct += attempt.correctActions;
        agg.total += attempt.totalActions;
        return agg;
      },
      { correct: 0, total: 0 }
    );
    const value = dayTotals.total ? (dayTotals.correct / dayTotals.total) * 100 : 0;
    return { date: key, value };
  });

  const uniqueDays = new Set(
    attempts.map((attempt) => {
      const completed = attempt.completedAt ? new Date(attempt.completedAt) : new Date();
      return completed.toDateString();
    })
  );
  let streak = 0;
  const cursor = new Date(now);
  while (true) {
    const key = cursor.toDateString();
    if (uniqueDays.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  const minutesPastWeek = attempts
    .filter((attempt) => {
      const completed = attempt.completedAt ? new Date(attempt.completedAt) : new Date();
      const diffDays = (now.getTime() - completed.getTime()) / 86400000;
      return diffDays <= 7;
    })
    .reduce((sum, attempt) => sum + attempt.timeSpentSeconds / 60, 0);

  const caseMap = new Map(allCases.map((caseSummary) => [caseSummary.slug, caseSummary]));
  const coverageMap = new Map<string, { system: string; discipline: string; correct: number; total: number }>();
  for (const attempt of attempts) {
    const caseSummary = caseMap.get(attempt.caseSlug);
    if (!caseSummary) continue;
    const system = caseSummary.system ?? subject.name;
    const discipline = caseSummary.discipline ?? "Clinical reasoning";
    const key = `${system}::${discipline}`;
    const entry = coverageMap.get(key) ?? { system, discipline, correct: 0, total: 0 };
    entry.correct += attempt.correctActions;
    entry.total += attempt.totalActions;
    coverageMap.set(key, entry);
  }
  const coverageHeatmap = Array.from(coverageMap.values()).map((entry) => ({
    system: entry.system,
    discipline: entry.discipline,
    value: entry.correct / Math.max(entry.total, 1),
  }));

  const caseProgress = new Map<string, { latest: number; previous: number | null }>();
  for (const attempt of attempts) {
    const accuracy = attempt.correctActions / Math.max(attempt.totalActions, 1);
    const progress = caseProgress.get(attempt.caseSlug);
    if (!progress) {
      caseProgress.set(attempt.caseSlug, { latest: accuracy, previous: null });
    } else {
      caseProgress.set(attempt.caseSlug, { latest: accuracy, previous: progress.latest });
    }
  }
  const biggestMovers = Array.from(caseProgress.entries())
    .map(([caseSlug, progress]) => {
      if (progress.previous == null) return null;
      const delta = Math.round((progress.latest - progress.previous) * 100);
      const title = caseMap.get(caseSlug)?.title ?? caseSlug;
      return { area: title, delta };
    })
    .filter((entry): entry is { area: string; delta: number } => entry !== null)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 2);

  const biasMonitor = [
    {
      label: "Late switches",
      impact: `${Math.round((attempts.reduce((sum, attempt) => sum + attempt.mistakes, 0) / attempts.length) * 10) / 10} avg missteps`,
    },
    {
      label: "Time pressure",
      impact: `${Math.round(minutesPastWeek ? (minutesPastWeek * 60) / attempts.length : 0)}s per action`,
    },
  ];

  const perActionTimes = attempts.flatMap((attempt) => {
    if (!attempt.totalActions) return [attempt.timeSpentSeconds];
    const perAction = attempt.timeSpentSeconds / Math.max(attempt.totalActions, 1);
    return Array(Math.max(1, attempt.totalActions)).fill(perAction);
  });
  perActionTimes.sort((a, b) => a - b);
  const medianIdx = Math.floor(perActionTimes.length / 2);
  const medianTime = perActionTimes.length
    ? Math.round(
        perActionTimes.length % 2 ? perActionTimes[medianIdx] : (perActionTimes[medianIdx - 1] + perActionTimes[medianIdx]) / 2
      )
    : 0;

  const imageAttempts = attempts.filter((attempt) => {
    const caseSummary = caseMap.get(attempt.caseSlug);
    return caseSummary?.skills?.some((skill) => skill.toLowerCase().includes("image"));
  });
  const imageAccuracy = imageAttempts.length
    ? Math.round(
        (imageAttempts.reduce((sum, attempt) => sum + attempt.correctActions, 0) /
          Math.max(imageAttempts.reduce((sum, attempt) => sum + attempt.totalActions, 0), 1)) *
          100
      )
    : 0;

  const studyQuality = Math.min(100, Math.round(overallAccuracy * 60 + Math.min(streak * 5, 25) + Math.min(minutesPastWeek, 120) / 2));

  const resourceLeverage = [
    { resource: `${subject.name} algorithm review`, effect: "+12% accuracy within 24h of completion" },
    { resource: "Bias checklist", effect: "Halves premature closure when opened before decision nodes" },
  ];

  const insights = [
    streak >= 3
      ? `Streak at ${streak} days - keep the cadence to lock in momentum.`
      : "Build a multi-day streak to stabilise recall.",
    minutesPastWeek >= 45 ? "Great focus window this week - protect that 45+ minute block." : "Aim for at least 45 focused minutes this week.",
  ];

  return {
    masteryTrend,
    streak,
    minutes: {
      id: "minutes",
      label: "Minutes practised (7d)",
      description: "Total focused minutes logged this week.",
      value: Math.round(minutesPastWeek),
      trend: masteryTrend.map((point) => ({ date: point.date, value: point.value })),
    },
    examReadiness: {
      id: "readiness",
      label: "Exam readiness",
      description: "Composite accuracy across recent attempts.",
      value: Math.round(overallAccuracy * 100),
    },
    coverageHeatmap,
    biggestMovers,
    biasMonitor,
    timeBudget: {
      id: "time-budget",
      label: "Median time per action",
      description: "Compare to your 90 second goal",
      value: medianTime,
    },
    imageSkills: {
      id: "image-skills",
      label: "Image interpretation",
      description: "Accuracy across cases tagged with imaging skills.",
      value: imageAccuracy,
    },
    studyQuality: {
      id: "study-quality",
      label: "Study quality",
      description: "Streak length x focus minutes x accuracy",
      value: studyQuality,
    },
    resourceLeverage,
    insights,
  };
}

export function buildResources(cases: CaseSummary[], attempts: CaseAttemptRecord[]) {
  const resources = new Map<string, { id: string; category: "algorithm" | "one-pager" | "atlas"; title: string; description: string; media?: { src: string; alt: string } }>();

  for (const caseSummary of cases) {
    resources.set(`algorithm-${caseSummary.slug}`, {
      id: `algorithm-${caseSummary.slug}`,
      category: "algorithm",
      title: `${caseSummary.title} flowchart`,
      description: "Flowchart template to capture discriminators after each case.",
    });
  }

  const challengingCases = attempts.filter((attempt) => attempt.mistakes > 0).slice(0, 3);
  for (const attempt of challengingCases) {
    const caseSummary = cases.find((caseItem) => caseItem.slug === attempt.caseSlug);
    if (!caseSummary) continue;
    resources.set(`debrief-${attempt.caseSlug}`, {
      id: `debrief-${attempt.caseSlug}`,
      category: "one-pager",
      title: `${caseSummary.title} debrief`,
      description: "Targeted debrief notes pulled in when mistakes stack up.",
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
  if (!resources.has("default-onepager")) {
    resources.set("default-onepager", {
      id: "default-onepager",
      category: "one-pager",
      title: "Bias buster checklist",
      description: "Quick checklist to avoid anchoring, confirmation bias, and premature closure during cases.",
    });
  }
  if (!resources.has("default-atlas")) {
    resources.set("default-atlas", {
      id: "default-atlas",
      category: "atlas",
      title: "Imaging pearls",
      description: "High-yield imaging findings linked from recent cases.",
      media: { src: "/images/resources/imaging-pearl.png", alt: "Imaging pearls preview" },
    });
  }

  return Array.from(resources.values());
}




