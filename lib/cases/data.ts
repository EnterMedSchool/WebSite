import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  caseCollections,
  caseSubjects,
  caseCases,
  caseStages,
  caseStageOptions,
  users,
} from "@/drizzle/schema";
import type {
  CaseCollectionSummary,
  CaseSubjectSummary,
  CaseSummary,
  CaseStage,
  CaseStageOption,
  PracticeBundle,
} from "@/lib/cases/types";
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

interface LoadCaseExperienceOptions {
  userId: number;
  collectionSlug: string;
}

export interface CaseCollectionsResult extends CaseCollectionSummary {
  subjects: CaseSubjectSummary[];
}

const FALLBACK_CASE_DB_ID = -1;

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickFormat(value: unknown): CaseSummary["format"] {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "guided" || lower === "legacy") return lower;
    if (lower === "branching") return "branching";
  }
  return "branching";
}

function deriveEntryStageSlug(stages: CaseStage[]): string {
  const sorted = [...stages].sort((a, b) => {
    if (a.phase === b.phase) return a.orderIndex - b.orderIndex;
    return a.phase - b.phase;
  });
  return sorted[0]?.slug ?? "";
}

function deriveManagementEntrySlug(stages: CaseStage[]): string | null {
  const management = stages
    .filter((stage) => stage.phase > 1)
    .sort((a, b) => {
      if (a.phase === b.phase) return a.orderIndex - b.orderIndex;
      return a.phase - b.phase;
    });
  return management[0]?.slug ?? null;
}

function stageMapFrom(stages: CaseStage[]): Record<string, CaseStage> {
  return stages.reduce<Record<string, CaseStage>>((acc, stage) => {
    acc[stage.slug] = stage;
    return acc;
  }, {});
}

function buildFallbackCase(subject?: CaseSubjectSummary): CaseSummary {
  const fallbackSubject: CaseSubjectSummary = subject ?? {
    slug: "endocrine",
    name: "Endocrine reasoning",
    description: "Reason through endocrine puzzles step by step.",
    position: 0,
    metadata: null,
    caseCount: 1,
  };

  let stageId = -1;
  let optionId = -1;

  const makeOption = (
    option: Omit<CaseStageOption, "id" | "reveals" | "outcomes"> & {
      reveals?: string[];
      outcomes?: Record<string, unknown> | null;
    }
  ): CaseStageOption => ({
    id: optionId--,
    value: option.value,
    label: option.label,
    description: option.description,
    detail: option.detail,
    isCorrect: option.isCorrect,
    advanceTo: option.advanceTo,
    costTime: option.costTime,
    scoreDelta: option.scoreDelta,
    reveals: option.reveals ?? [],
    outcomes: option.outcomes ?? (option.isCorrect ? { feedback: "Keep going!" } : { feedback: "Consider the data again." }),
  });

  const stages: CaseStage[] = [
    {
      id: stageId--,
      slug: "scene-intro",
      title: "Chief complaint intake",
      subtitle: "Absorb the presentation before acting.",
      phase: 1,
      stageType: "info",
      orderIndex: 0,
      allowMultiple: false,
      isTerminal: false,
      info: [
        "35-year-old presents with progressive weight gain, facial rounding, and proximal muscle weakness.",
        "Vital signs: BP 158/96 mmHg, HR 92 bpm, BMI 31.",
        "Physical exam: violaceous abdominal striae, dorsocervical fat pad, scattered ecchymoses.",
      ],
      metadata: { scene: "history" },
      options: [
        makeOption({
          value: "summon-team",
          label: "Pin a working problem list and continue",
          description: "Frame hypotheses before ordering tests.",
          detail: "Captures red-flag items and primes reasoning engine.",
          isCorrect: true,
          advanceTo: "scene-initial-action",
          costTime: 2,
          scoreDelta: 1,
          reveals: ["Working list: Cushing syndrome vs. pseudo-Cushing", "No acute instability noted"],
          outcomes: { feedback: "Good start-keep track of hypotheses as new data arrives." },
        }),
      ],
    },
    {
      id: stageId--,
      slug: "scene-initial-action",
      title: "First investigative step",
      subtitle: "Choose the most appropriate immediate action.",
      phase: 1,
      stageType: "decision",
      orderIndex: 1,
      allowMultiple: false,
      isTerminal: false,
      info: [],
      metadata: { scene: "planning" },
      options: [
        makeOption({
          value: "baseline-eval",
          label: "Order overnight low-dose dex suppression and baseline labs",
          description: "Confirm cortisol excess and gather metabolic clues.",
          detail: "Returns next-morning cortisol, ACTH, glucose, potassium.",
          isCorrect: true,
          advanceTo: "scene-labs",
          costTime: 30,
          scoreDelta: 6,
          reveals: [
            "Morning cortisol: 28 ug/dL (fails to suppress)",
            "ACTH: 78 pg/mL (elevated)",
            "Glucose: 198 mg/dL; Potassium: 3.1 mEq/L",
          ],
          outcomes: { feedback: "Excellent stewardship-verified hypercortisolism before localization." },
        }),
        makeOption({
          value: "start-keto",
          label: "Start ketoconazole immediately",
          description: "Treat symptomatically before confirming etiology.",
          detail: "Improves cortisol short term but delays diagnosis.",
          isCorrect: false,
          advanceTo: "scene-labs",
          costTime: 15,
          scoreDelta: -4,
          reveals: [],
          outcomes: { feedback: "Therapy without a diagnosis risks masking key localization data." },
        }),
        makeOption({
          value: "pituitary-mri-now",
          label: "Order pituitary MRI immediately",
          description: "Attempt localization before biochemical proof.",
          detail: "Imaging may reveal incidentalomas.",
          isCorrect: false,
          advanceTo: "scene-labs",
          costTime: 25,
          scoreDelta: -2,
          reveals: [],
          outcomes: { feedback: "Image after biochemical confirmation to avoid false leads." },
        }),
      ],
    },
    {
      id: stageId--,
      slug: "scene-labs",
      title: "Focused testing",
      subtitle: "Decide the next highest-yield test.",
      phase: 1,
      stageType: "order",
      orderIndex: 2,
      allowMultiple: false,
      isTerminal: false,
      info: [
        "You confirmed ACTH-dependent hypercortisolism.",
        "Noncontrast pituitary MRI is pending.",
      ],
      metadata: { scene: "labs" },
      options: [
        makeOption({
          value: "high-dose-dex",
          label: "Perform high-dose dexamethasone suppression test",
          description: "Differentiate pituitary from ectopic ACTH.",
          detail: "Suppression >50% supports pituitary source.",
          isCorrect: true,
          advanceTo: "scene-diagnosis",
          costTime: 45,
          scoreDelta: 6,
          reveals: ["Cortisol suppresses 60% from baseline", "Favors pituitary ACTH source"],
          outcomes: { feedback: "Targeted localization accomplished with minimal waste." },
        }),
        makeOption({
          value: "inferior-petrosal",
          label: "Send for inferior petrosal sinus sampling now",
          description: "Invasive localization prior to basic testing.",
          detail: "High resource cost when MRI pending.",
          isCorrect: false,
          advanceTo: "scene-diagnosis",
          costTime: 90,
          scoreDelta: -5,
          reveals: [],
          outcomes: { feedback: "Reserve IPSS for discordant labs or negative MRI." },
        }),
        makeOption({
          value: "repeat-basal",
          label: "Repeat the low-dose dexamethasone test",
          description: "Duplicate testing seldom shifts probability.",
          detail: "Consumes time without new data.",
          isCorrect: false,
          advanceTo: "scene-diagnosis",
          costTime: 20,
          scoreDelta: -3,
          reveals: [],
          outcomes: { feedback: "Redundant testing adds fatigue and no clarity." },
        }),
      ],
    },
    {
      id: stageId--,
      slug: "scene-diagnosis",
      title: "Synthesize the evidence",
      subtitle: "Commit to the most likely diagnosis.",
      phase: 1,
      stageType: "diagnosis",
      orderIndex: 3,
      allowMultiple: false,
      isTerminal: false,
      info: [
        "MRI: 6 mm pituitary microadenoma.",
        "Dexamethasone suppression favored pituitary source.",
      ],
      metadata: { scene: "diagnosis" },
      options: [
        makeOption({
          value: "cushing-disease",
          label: "Pituitary ACTH-secreting adenoma (Cushing disease)",
          description: "Integrates labs and imaging coherently.",
          detail: "Phase 1 complete when selected.",
          isCorrect: true,
          advanceTo: "scene-management-intro",
          costTime: 10,
          scoreDelta: 8,
          reveals: ["Diagnosis locked: pituitary ACTH adenoma"],
          outcomes: { feedback: "Spot on-transition to management cascade.", phaseComplete: true },
        }),
        makeOption({
          value: "ectopic-acth",
          label: "Ectopic ACTH from occult malignancy",
          description: "Would not suppress with high-dose dex.",
          detail: "Imaging/labs argue against this.",
          isCorrect: false,
          advanceTo: "scene-management-intro",
          costTime: 15,
          scoreDelta: -6,
          reveals: [],
          outcomes: { feedback: "Lab pattern and MRI favor pituitary over ectopic source." },
        }),
        makeOption({
          value: "adrenal-adenoma",
          label: "Adrenal cortisol-producing adenoma",
          description: "Typically ACTH suppressed.",
          detail: "Does not fit lab set.",
          isCorrect: false,
          advanceTo: "scene-management-intro",
          costTime: 15,
          scoreDelta: -5,
          reveals: [],
          outcomes: { feedback: "ACTH-independent disease would suppress ACTH." },
        }),
      ],
    },
    {
      id: stageId--,
      slug: "scene-management-intro",
      title: "Management briefing",
      subtitle: "Confirm readiness before definitive therapy.",
      phase: 2,
      stageType: "info",
      orderIndex: 0,
      allowMultiple: false,
      isTerminal: false,
      info: [
        "Endocrine tumor board confirms pituitary source.",
        "Patient stable; no acute decompensation.",
        "Goal: definitive treatment plan + peri-op strategy.",
      ],
      metadata: { scene: "transition" },
      options: [
        makeOption({
          value: "advance-to-management",
          label: "Move into management planning",
          description: "Set management priorities.",
          detail: "Open management cascade.",
          isCorrect: true,
          advanceTo: "scene-management",
          costTime: 5,
          scoreDelta: 2,
          reveals: [],
          outcomes: { feedback: "Shift gears-now manage definitively." },
        }),
      ],
    },
    {
      id: stageId--,
      slug: "scene-management",
      title: "Definitive next step",
      subtitle: "Select the most appropriate intervention.",
      phase: 2,
      stageType: "management",
      orderIndex: 1,
      allowMultiple: false,
      isTerminal: false,
      info: [
        "Surgery consult available within 48 hours.",
        "Patient desires definitive solution.",
      ],
      metadata: { scene: "management" },
      options: [
        makeOption({
          value: "transsphenoidal",
          label: "Refer for transsphenoidal resection",
          description: "Definitive therapy for pituitary microadenoma.",
          detail: "Arrange medical optimization.",
          isCorrect: true,
          advanceTo: "scene-summary",
          costTime: 30,
          scoreDelta: 10,
          reveals: ["Plan: Transsphenoidal surgery + peri-op steroid bridging"],
          outcomes: { feedback: "Definitive management chosen.", caseComplete: true },
        }),
        makeOption({
          value: "long-term-keto",
          label: "Commit to chronic ketoconazole therapy",
          description: "Bridging option for unresectable disease.",
          detail: "Not definitive; consider only if surgery unsuitable.",
          isCorrect: false,
          advanceTo: "scene-summary",
          costTime: 20,
          scoreDelta: -4,
          reveals: [],
          outcomes: { feedback: "Medical therapy is a bridge, not definitive for surgical candidates." },
        }),
        makeOption({
          value: "bilateral-adrenalectomy",
          label: "Schedule bilateral adrenalectomy",
          description: "Salvage option when pituitary therapy fails.",
          detail: "Higher morbidity.",
          isCorrect: false,
          advanceTo: "scene-summary",
          costTime: 45,
          scoreDelta: -6,
          reveals: [],
          outcomes: { feedback: "Reserve adrenalectomy for refractory cases." },
        }),
      ],
    },
    {
      id: stageId--,
      slug: "scene-summary",
      title: "Case wrap-up",
      subtitle: "Review the reasoning trail and highlight lessons.",
      phase: 2,
      stageType: "summary",
      orderIndex: 2,
      allowMultiple: false,
      isTerminal: true,
      info: [
        "High-yield moves: targeted labs ? high-dose dex suppression ? MRI correlation.",
        "Key stewardship metric: only one unnecessary test ordered if any.",
        "Next-level extension: discuss long-term follow-up for recurrence.",
      ],
      metadata: { scene: "summary" },
      options: [],
    },
  ];

  const entryStageSlug = deriveEntryStageSlug(stages);
  const managementEntrySlug = deriveManagementEntrySlug(stages);

  return {
    id: "demo-hypercortisolism",
    dbId: FALLBACK_CASE_DB_ID,
    slug: "demo-hypercortisolism",
    title: "Hypercortisolism diagnostic pathway",
    subtitle: "Solve the cortisol mystery step by step.",
    overview: "Investigate a Cushing-like presentation through a branching, stewardship-focused cascade.",
    subjectSlug: fallbackSubject.slug,
    subjectName: fallbackSubject.name,
    difficulty: "moderate",
    estimatedMinutes: 20,
    phaseCount: 2,
    stageCount: stages.length,
    entryStageSlug,
    managementEntrySlug,
    system: fallbackSubject.name,
    discipline: "Clinical reasoning",
    physicianTasks: ["History", "Order tests", "Synthesize diagnosis", "Management"],
    skills: ["Algorithm", "Lab interpretation"],
    format: "branching",
    tags: ["endocrine", "cortisol", "clinical reasoning"],
    graph: {
      stages,
      stageMap: stageMapFrom(stages),
      entryStageSlug,
      managementEntrySlug,
    },
  };
}

export async function loadCaseCollections(): Promise<CaseCollectionsResult[]> {
  const collectionRows = await db
    .select({
      id: caseCollections.id,
      slug: caseCollections.slug,
      name: caseCollections.name,
      description: caseCollections.description,
      accentColor: caseCollections.accentColor,
      metadata: caseCollections.metadata,
    })
    .from(caseCollections)
    .orderBy(asc(caseCollections.name));

  const subjectRows = await db
    .select({
      id: caseSubjects.id,
      collectionId: caseSubjects.collectionId,
      slug: caseSubjects.slug,
      name: caseSubjects.name,
      description: caseSubjects.description,
      position: caseSubjects.position,
      metadata: caseSubjects.metadata,
    })
    .from(caseSubjects)
    .orderBy(asc(caseSubjects.collectionId), asc(caseSubjects.position));

  const byCollection: Record<number, CaseSubjectSummary[]> = {};
  for (const s of subjectRows) {
    if (!byCollection[s.collectionId]) byCollection[s.collectionId] = [];
    byCollection[s.collectionId].push({
      slug: s.slug,
      name: s.name,
      description: s.description,
      position: s.position,
      metadata: s.metadata as Record<string, unknown> | null,
    });
  }

  return collectionRows.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    accentColor: c.accentColor,
    metadata: c.metadata as Record<string, unknown> | null,
    subjects: (byCollection[c.id] ?? []).sort((a, b) => a.position - b.position),
  }));
}

export async function loadCaseExperience({ userId, collectionSlug }: LoadCaseExperienceOptions) {
  const collections = await loadCaseCollections();
  const collection = collections.find((c) => c.slug === collectionSlug);
  if (!collection) {
    throw new Error(`Unknown case collection: ${collectionSlug}`);
  }

  const caseRows = await db
    .select({
      caseId: caseCases.id,
      subjectId: caseCases.subjectId,
      slug: caseCases.slug,
      title: caseCases.title,
      subtitle: caseCases.subtitle,
      overview: caseCases.overview,
      difficulty: caseCases.difficulty,
      estimatedMinutes: caseCases.estimatedMinutes,
      phaseCount: caseCases.phaseCount,
      metadata: caseCases.metadata,
      subjectSlug: caseSubjects.slug,
      subjectName: caseSubjects.name,
    })
    .from(caseCases)
    .innerJoin(caseSubjects, eq(caseCases.subjectId, caseSubjects.id))
    .innerJoin(caseCollections, eq(caseSubjects.collectionId, caseCollections.id))
    .where(eq(caseCollections.slug, collectionSlug))
    .orderBy(asc(caseSubjects.position), asc(caseCases.id));

  const caseIds = caseRows.map((row) => row.caseId);

  const stageRows = caseIds.length
    ? await db
        .select({
          id: caseStages.id,
          caseId: caseStages.caseId,
          slug: caseStages.slug,
          title: caseStages.title,
          subtitle: caseStages.subtitle,
          phase: caseStages.phase,
          stageType: caseStages.stageType,
          orderIndex: caseStages.orderIndex,
          allowMultiple: caseStages.allowMultiple,
          isTerminal: caseStages.isTerminal,
          info: caseStages.info,
          metadata: caseStages.metadata,
        })
        .from(caseStages)
        .where(inArray(caseStages.caseId, caseIds))
        .orderBy(asc(caseStages.caseId), asc(caseStages.phase), asc(caseStages.orderIndex), asc(caseStages.id))
    : [];

  const stageIds = stageRows.map((row) => row.id);

  const optionRows = stageIds.length
    ? await db
        .select({
          id: caseStageOptions.id,
          stageId: caseStageOptions.stageId,
          value: caseStageOptions.value,
          label: caseStageOptions.label,
          description: caseStageOptions.description,
          detail: caseStageOptions.detail,
          isCorrect: caseStageOptions.isCorrect,
          advanceTo: caseStageOptions.advanceTo,
          costTime: caseStageOptions.costTime,
          scoreDelta: caseStageOptions.scoreDelta,
          reveals: caseStageOptions.reveals,
          outcomes: caseStageOptions.outcomes,
          metadata: caseStageOptions.metadata,
        })
        .from(caseStageOptions)
        .where(inArray(caseStageOptions.stageId, stageIds))
        .orderBy(asc(caseStageOptions.stageId), asc(caseStageOptions.id))
    : [];

  const optionsByStage = new Map<number, CaseStageOption[]>();
  for (const option of optionRows) {
    const list = optionsByStage.get(option.stageId) ?? [];
    list.push({
      id: option.id,
      value: option.value,
      label: option.label,
      description: option.description,
      detail: option.detail,
      isCorrect: option.isCorrect,
      advanceTo: option.advanceTo ?? null,
      costTime: option.costTime ?? null,
      scoreDelta: option.scoreDelta,
      reveals: toStringArray(option.reveals),
      outcomes: toRecord(option.outcomes),
    });
    optionsByStage.set(option.stageId, list);
  }

  const stagesByCase = new Map<number, CaseStage[]>();
  for (const stage of stageRows) {
    const mappedStage: CaseStage = {
      id: stage.id,
      slug: stage.slug,
      title: stage.title,
      subtitle: stage.subtitle,
      phase: stage.phase,
      stageType: stage.stageType as CaseStage["stageType"],
      orderIndex: stage.orderIndex,
      allowMultiple: stage.allowMultiple,
      isTerminal: stage.isTerminal,
      info: toStringArray(stage.info),
      metadata: toRecord(stage.metadata),
      options: optionsByStage.get(stage.id) ?? [],
    };
    const list = stagesByCase.get(stage.caseId) ?? [];
    list.push(mappedStage);
    stagesByCase.set(stage.caseId, list);
  }

  const cases: CaseSummary[] = caseRows.map((row) => {
    const meta = toRecord(row.metadata) ?? {};
    const stages = stagesByCase.get(row.caseId) ?? [];
    const phaseCount = row.phaseCount ?? (stages.length ? Math.max(...stages.map((stage) => stage.phase)) : 1);
    const entryStageSlug = stages.length
      ? deriveEntryStageSlug(stages)
      : typeof meta.entryStageSlug === "string"
        ? (meta.entryStageSlug as string)
        : "scene-intro";
    const managementEntrySlug = stages.length ? deriveManagementEntrySlug(stages) : null;
    const graph = stages.length
      ? {
          stages,
          stageMap: stageMapFrom(stages),
          entryStageSlug,
          managementEntrySlug,
        }
      : undefined;

    return {
      id: row.slug,
      dbId: row.caseId,
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      overview: row.overview,
      subjectSlug: row.subjectSlug,
      subjectName: row.subjectName,
      difficulty: (row.difficulty as CaseSummary["difficulty"]) ?? "moderate",
      estimatedMinutes: row.estimatedMinutes ?? 20,
      phaseCount,
      stageCount: stages.length,
      entryStageSlug,
      managementEntrySlug,
      system: typeof meta.system === "string" ? (meta.system as string) : row.subjectName,
      discipline: typeof meta.discipline === "string" ? (meta.discipline as string) : "Clinical reasoning",
      physicianTasks: Array.isArray(meta.physicianTasks)
        ? (meta.physicianTasks as unknown[]).map((item) => String(item))
        : ["History", "Order tests", "Synthesize diagnosis"],
      skills: Array.isArray(meta.skills) ? (meta.skills as unknown[]).map((item) => String(item)) : ["Algorithm"],
      format: pickFormat(meta.format),
      tags: Array.isArray(meta.tags) ? (meta.tags as unknown[]).map((item) => String(item)) : [],
      graph,
    } satisfies CaseSummary;
  });

  if (!cases.length) {
    const fallbackSubject = collection.subjects[0] ?? undefined;
    cases.push(buildFallbackCase(fallbackSubject));
  }

  const subjects = collection.subjects.map((subject) => ({
    ...subject,
    caseCount: cases.filter((c) => c.subjectSlug === subject.slug).length,
  }));

  for (const caseSummary of cases) {
    if (!subjects.find((subject) => subject.slug === caseSummary.subjectSlug)) {
      subjects.push({
        slug: caseSummary.subjectSlug,
        name: caseSummary.subjectName,
        description: "",
        position: subjects.length,
        metadata: null,
        caseCount: cases.filter((c) => c.subjectSlug === caseSummary.subjectSlug).length,
      });
    }
  }

  const activeSubject = subjects.find((s) => (s.caseCount ?? 0) > 0) ?? subjects[0] ?? {
    slug: "general",
    name: "General",
    description: "",
    position: 0,
    metadata: null,
    caseCount: cases.length,
  };

  const activeCases = cases.filter((c) => c.subjectSlug === activeSubject.slug);

  const userRow = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const learnerName = userRow[0]?.name ?? "Learner";

  const bundle = buildPracticeBundle({
    userId,
    userName: learnerName,
    collection,
    availableCollections: collections,
    subjects,
    activeSubject,
    cases,
    activeCases,
  });

  return { bundle, collection, subjects, cases, availableCollections: collections };
}

type BuildBundleArgs = {
  userId: number;
  userName: string;
  collection: CaseCollectionsResult;
  availableCollections: CaseCollectionsResult[];
  subjects: CaseSubjectSummary[];
  activeSubject: CaseSubjectSummary;
  cases: CaseSummary[];
  activeCases: CaseSummary[];
};

function buildPracticeBundle({
  userId,
  userName,
  collection,
  availableCollections,
  subjects,
  activeSubject,
  cases,
  activeCases,
}: BuildBundleArgs): PracticeBundle {
  const now = new Date();
  const iso = (offsetDays: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString();
  };

  const todayPlan = buildTodayPlan(activeSubject, activeCases);
  const paceStatus = buildPaceStatus(todayPlan);
  const weaknessNudges = buildWeaknessNudges(activeSubject, activeCases);
  const reviewQueue = buildReviewQueue(activeSubject, activeCases, iso);
  const notifications = buildNotifications(collection.slug, activeSubject, activeCases, iso);
  const sessionSummary = buildSessionSummary(activeSubject, activeCases);
  const dashboard = buildDashboard(activeSubject, cases);
  const resources = buildResources(activeCases);

  return {
    user: {
      id: userId,
      name: userName,
      examDate: iso(120),
      targetDailyMinutes: 120,
      weeklyAvailability: 5,
      preferredMode: "study",
    },
    collection: {
      slug: collection.slug,
      name: collection.name,
      description: collection.description,
      accentColor: collection.accentColor,
      metadata: collection.metadata,
    },
    availableCollections: availableCollections.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description,
      accentColor: c.accentColor,
      metadata: c.metadata,
    })),
    subjects,
    activeSubject,
    todayPlan,
    paceStatus,
    weaknessNudges,
    modes: ["study", "exam", "rapid", "adaptive", "custom"],
    cases,
    reviewQueue,
    sessionSummary,
    dashboard,
    notifications,
    resources,
  };
}

