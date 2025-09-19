import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/study/auth";
import {
  caseAttempts,
  caseAttemptSteps,
  caseCases,
  caseCollections,
  caseStageOptions,
  caseStages,
  caseSubjects,
} from "@/drizzle/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AttemptStepPayload {
  stageId: number;
  stageSlug: string;
  optionId: number;
  optionValue: string;
  correct: boolean;
  costTime?: number | null;
  takenAt: number;
}

interface AttemptSummaryPayload {
  totalActions: number;
  correctActions: number;
  incorrectActions: number;
  score: number;
  mistakes: number;
  phase: number;
  masteryEnergy?: number;
  comboLevel?: number;
  startedAt: number;
  completedAt: number;
  timeSpentSeconds?: number;
}

interface AttemptPayload {
  caseSlug: string;
  steps: AttemptStepPayload[];
  summary: AttemptSummaryPayload;
  evidence?: string[];
}

export async function POST(req: Request, { params }: { params: { collection: string; caseSlug: string } }) {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: AttemptPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!payload?.caseSlug || typeof payload.caseSlug !== "string") {
    return NextResponse.json({ error: "missing_case_slug" }, { status: 400 });
  }

  const bodyCaseSlug = payload.caseSlug.trim();
  if (!bodyCaseSlug) {
    return NextResponse.json({ error: "missing_case_slug" }, { status: 400 });
  }
  if (bodyCaseSlug !== params.caseSlug) {
    return NextResponse.json({ error: "case_slug_mismatch" }, { status: 400 });
  }
  payload.caseSlug = bodyCaseSlug;

  if (!Array.isArray(payload.steps) || payload.steps.length === 0) {
    return NextResponse.json({ error: "missing_steps" }, { status: 400 });
  }

  const summary = payload.summary;
  if (!summary || typeof summary !== "object") {
    return NextResponse.json({ error: "missing_summary" }, { status: 400 });
  }

  const stepRows = payload.steps.filter((step): step is AttemptStepPayload => {
    return (
      step != null &&
      typeof step.stageId === "number" &&
      Number.isFinite(step.stageId) &&
      typeof step.optionId === "number" &&
      Number.isFinite(step.optionId) &&
      typeof step.optionValue === "string" &&
      typeof step.takenAt === "number"
    );
  });

  if (!stepRows.length) {
    return NextResponse.json({ error: "no_valid_steps" }, { status: 400 });
  }

  const [caseRow] = await db
    .select({
      id: caseCases.id,
      slug: caseCases.slug,
      subjectId: caseCases.subjectId,
      subjectSlug: caseSubjects.slug,
      subjectName: caseSubjects.name,
    })
    .from(caseCases)
    .innerJoin(caseSubjects, eq(caseSubjects.id, caseCases.subjectId))
    .innerJoin(caseCollections, eq(caseCollections.id, caseSubjects.collectionId))
    .where(and(eq(caseCollections.slug, params.collection), eq(caseCases.slug, params.caseSlug)))
    .limit(1);

  if (!caseRow) {
    return NextResponse.json({ error: "case_not_found" }, { status: 404 });
  }

  const stageRows = await db
    .select({ id: caseStages.id })
    .from(caseStages)
    .where(eq(caseStages.caseId, caseRow.id));
  const stageIds = stageRows.map((row) => Number(row.id));
  if (!stageIds.length) {
    return NextResponse.json({ error: "case_missing_stages" }, { status: 400 });
  }

  const optionRows = await db
    .select({ id: caseStageOptions.id, stageId: caseStageOptions.stageId })
    .from(caseStageOptions)
    .where(inArray(caseStageOptions.stageId, stageIds));

  const validStageIds = new Set(stageIds);
  const validOptionsByStage = new Map<number, Set<number>>();
  for (const option of optionRows) {
    const set = validOptionsByStage.get(Number(option.stageId)) ?? new Set<number>();
    set.add(Number(option.id));
    validOptionsByStage.set(Number(option.stageId), set);
  }

  const orderedSteps = [...stepRows].sort((a, b) => a.takenAt - b.takenAt);
  const startedAtMs = Number.isFinite(summary.startedAt) ? summary.startedAt : orderedSteps[0].takenAt;
  const completedAtMs = Number.isFinite(summary.completedAt)
    ? summary.completedAt
    : orderedSteps[orderedSteps.length - 1].takenAt;
  const timeSpentSeconds = summary.timeSpentSeconds ?? Math.max(0, Math.round((completedAtMs - startedAtMs) / 1000));

  let previousTimestamp = startedAtMs;
  const perStepSeconds = new Map<number, number>();
  for (const step of orderedSteps) {
    const delta = Math.max(0, Math.round((step.takenAt - previousTimestamp) / 1000));
    perStepSeconds.set(step.optionId, delta);
    previousTimestamp = step.takenAt;
  }

  const correctActions = summary.correctActions ?? stepRows.filter((step) => step.correct).length;
  const incorrectActions = summary.incorrectActions ?? stepRows.filter((step) => !step.correct).length;
  const totalActions = summary.totalActions ?? stepRows.length;
  const mistakes = summary.mistakes ?? incorrectActions;

  const attemptInsert = await db
    .insert(caseAttempts)
    .values({
      userId,
      caseId: caseRow.id,
      status: "completed",
      phase: summary.phase ?? 1,
      currentStageSlug: null,
      score: summary.score ?? 0,
      evidence: Array.isArray(payload.evidence) ? payload.evidence : [],
      state: {
        correctActions,
        incorrectActions,
        totalActions,
        mistakes,
        timeSpentSeconds,
        masteryEnergy: summary.masteryEnergy ?? null,
        comboLevel: summary.comboLevel ?? null,
        engineVersion: 1,
      },
      startedAt: new Date(startedAtMs),
      updatedAt: new Date(),
      completedAt: new Date(completedAtMs),
    })
    .returning({ id: caseAttempts.id });

  const attemptId = Number(attemptInsert[0]?.id);
  if (!attemptId) {
    return NextResponse.json({ error: "attempt_not_recorded" }, { status: 500 });
  }

  const stepInserts = [] as Array<typeof caseAttemptSteps.$inferInsert>;
  for (const step of stepRows) {
    if (!validStageIds.has(step.stageId)) {
      continue;
    }
    const optionSet = validOptionsByStage.get(step.stageId);
    if (!optionSet || !optionSet.has(step.optionId)) {
      continue;
    }
    const timeSpent = perStepSeconds.get(step.optionId) ?? 0;
    stepInserts.push({
      attemptId,
      stageId: step.stageId,
      optionId: step.optionId,
      optionValue: step.optionValue,
      correct: !!step.correct,
      timeSpent: timeSpent,
      evidence: null,
      state: null,
      takenAt: new Date(step.takenAt),
    });
  }

  if (stepInserts.length) {
    await db.insert(caseAttemptSteps).values(stepInserts);
  }

  return NextResponse.json({
    attempt: {
      id: attemptId,
      caseSlug: caseRow.slug,
      subjectSlug: caseRow.subjectSlug,
      totalActions,
      correctActions,
      incorrectActions,
      timeSpentSeconds,
      score: summary.score ?? 0,
      startedAt: new Date(startedAtMs).toISOString(),
      completedAt: new Date(completedAtMs).toISOString(),
    },
  });
}


