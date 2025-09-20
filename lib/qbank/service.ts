import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  qbankAttempts,
  qbankAttemptItems,
  qbankExams,
  qbankQuestionExplanations,
  qbankQuestionOptions,
  qbankQuestionReferences,
  qbankQuestionStimuli,
  qbankQuestions,
  qbankQuestionTopicLinks,
  qbankSections,
  qbankTopics,
} from "@/drizzle/schema";

const DEFAULT_QUESTION_LIMIT = 6;

export type StimulusBlock = {
  locale: string;
  stimulusType: string;
  orderIndex: number;
  content: unknown;
};

export type QuestionOption = {
  optionId: number;
  value: string;
  label: string | null;
  content: unknown;
  orderIndex: number;
  metadata: Record<string, unknown> | null;
};

export type QuestionExplanation = {
  explanationType: string;
  locale: string;
  body: unknown;
  orderIndex: number;
  metadata: Record<string, unknown> | null;
};

export type QuestionReference = {
  label: string;
  url: string | null;
  citation: string | null;
  orderIndex: number;
  metadata: Record<string, unknown> | null;
};

export type AttemptQuestionPayload = {
  attemptItemId: number;
  questionId: number;
  publicId: string;
  version: number;
  questionType: string;
  difficulty: string | null;
  cognitiveLevel: string | null;
  skillType: string | null;
  metadata: Record<string, unknown> | null;
  stimuli: StimulusBlock[];
  options: QuestionOption[];
  explanations: QuestionExplanation[];
  references: QuestionReference[];
};

export type PracticeAttempt = {
  attemptId: number;
  examSlug: string;
  topicSlug: string | null;
  questionCount: number;
  settings: Record<string, unknown>;
  questions: AttemptQuestionPayload[];
};

export class QbankServiceError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? code);
    this.name = "QbankServiceError";
  }
}

export async function getExamOverview(examSlug: string) {
  const exam = await db.query.qbankExams.findFirst({
    where: eq(qbankExams.slug, examSlug),
  });

  if (!exam) {
    throw new QbankServiceError("exam_not_found");
  }

  const sections = await db.query.qbankSections.findMany({
    where: eq(qbankSections.examId, exam.id),
    orderBy: (section, { asc }) => [asc(section.orderIndex), asc(section.id)],
  });

  const topics = await db.query.qbankTopics.findMany({
    where: eq(qbankTopics.examId, exam.id),
    orderBy: (topic, { asc }) => [asc(topic.depth), asc(topic.orderIndex), asc(topic.id)],
  });

  return {
    exam,
    sections,
    topics,
  };
}

interface CreateAttemptInput {
  userId: number;
  examSlug: string;
  topicSlug?: string | null;
  limit?: number;
}

export async function createPracticeAttempt({
  userId,
  examSlug,
  topicSlug,
  limit = DEFAULT_QUESTION_LIMIT,
}: CreateAttemptInput): Promise<PracticeAttempt> {
  if (!userId) {
    throw new QbankServiceError("unauthorized");
  }

  const exam = await db.query.qbankExams.findFirst({
    where: eq(qbankExams.slug, examSlug),
  });

  if (!exam) {
    throw new QbankServiceError("exam_not_found");
  }

  let topicId: number | null = null;
  if (topicSlug) {
    const topic = await db.query.qbankTopics.findFirst({
      where: and(eq(qbankTopics.examId, exam.id), eq(qbankTopics.slug, topicSlug)),
    });
    if (!topic) {
      throw new QbankServiceError("topic_not_found");
    }
    topicId = Number(topic.id);
  }

  const questionRows = await db.query.qbankQuestions.findMany({
    where: and(
      eq(qbankQuestions.examId, exam.id),
      eq(qbankQuestions.isLatest, true),
      eq(qbankQuestions.status, "live" as any),
      topicId ? eq(qbankQuestions.primaryTopicId, topicId) : undefined,
    ),
    orderBy: (question, { asc }) => [asc(question.difficulty ?? ""), asc(question.id)],
  });

  if (!questionRows.length) {
    throw new QbankServiceError("no_questions_available");
  }

  const selectedQuestions = shuffle([...questionRows]).slice(0, Math.max(1, Math.min(limit, questionRows.length)));
  selectedQuestions.sort((a, b) => Number(a.id) - Number(b.id));

  const questionIds = selectedQuestions.map((q) => Number(q.id));

  const [stimuliRows, optionRows, explanationRows, referenceRows] = await Promise.all([
    db.query.qbankQuestionStimuli.findMany({
      where: inArray(qbankQuestionStimuli.questionId, questionIds),
      orderBy: (stimulus, { asc }) => [asc(stimulus.questionId), asc(stimulus.orderIndex)],
    }),
    db.query.qbankQuestionOptions.findMany({
      where: inArray(qbankQuestionOptions.questionId, questionIds),
      orderBy: (option, { asc }) => [asc(option.questionId), asc(option.orderIndex)],
    }),
    db.query.qbankQuestionExplanations.findMany({
      where: inArray(qbankQuestionExplanations.questionId, questionIds),
      orderBy: (explanation, { asc }) => [asc(explanation.questionId), asc(explanation.orderIndex)],
    }),
    db.query.qbankQuestionReferences.findMany({
      where: inArray(qbankQuestionReferences.questionId, questionIds),
      orderBy: (reference, { asc }) => [asc(reference.questionId), asc(reference.orderIndex)],
    }),
  ]);

  const optionMap = new Map<number, typeof optionRows>();
  for (const option of optionRows) {
    const list = optionMap.get(Number(option.questionId)) ?? [];
    list.push(option);
    optionMap.set(Number(option.questionId), list);
  }

  const stimuliMap = groupByQuestion(stimuliRows);
  const explanationsMap = groupByQuestion(explanationRows);
  const referencesMap = groupByQuestion(referenceRows);

  const preparedQuestions = selectedQuestions.map((question, index) => {
    const qId = Number(question.id);
    const options = [...(optionMap.get(qId) ?? [])].sort((a, b) => Number(a.orderIndex) - Number(b.orderIndex));
    const correctOptionIds = options.filter((option) => option.isCorrect).map((option) => Number(option.id));
    const correctOptionValues = options.filter((option) => option.isCorrect).map((option) => option.value ?? "");

    return {
      question,
      displayOrder: index,
      correctOptionIds,
      correctOptionValues,
      options,
      stimuli: stimuliMap.get(qId) ?? [],
      explanations: explanationsMap.get(qId) ?? [],
      references: referencesMap.get(qId) ?? [],
    };
  });

  if (!preparedQuestions.length) {
    throw new QbankServiceError("no_questions_selected");
  }

  const attemptInsert = await db
    .insert(qbankAttempts)
    .values({
      userId,
      examId: exam.id,
      sectionId: null,
      mode: "untimed",
      status: "in_progress",
      questionCount: preparedQuestions.length,
      settings: {
        topicSlug: topicSlug ?? null,
        limit,
      },
      analytics: {},
      startedAt: new Date(),
    })
    .returning({ id: qbankAttempts.id });

  const attemptId = Number(attemptInsert[0]?.id);
  if (!attemptId) {
    throw new QbankServiceError("attempt_not_created");
  }

  const attemptItems = await db
    .insert(qbankAttemptItems)
    .values(
      preparedQuestions.map(({ question, displayOrder, correctOptionIds, correctOptionValues }) => ({
        attemptId,
        questionId: question.id as number | null,
        questionPublicId: question.publicId,
        questionVersion: question.version,
        displayOrder,
        promptSeed: {
          questionType: question.questionType,
          correctOptionIds,
          correctOptionValues,
        },
        metadata: {},
      }))
    )
    .returning({ id: qbankAttemptItems.id, questionId: qbankAttemptItems.questionId, displayOrder: qbankAttemptItems.displayOrder });

  const itemIdByQuestionId = new Map<number, number>();
  for (const item of attemptItems) {
    itemIdByQuestionId.set(Number(item.questionId), Number(item.id));
  }

  const questionsPayload: AttemptQuestionPayload[] = preparedQuestions.map(
    ({ question, options, stimuli, explanations, references }) => ({
      attemptItemId: Number(itemIdByQuestionId.get(Number(question.id))),
      questionId: Number(question.id),
      publicId: question.publicId,
      version: question.version,
      questionType: question.questionType,
      difficulty: question.difficulty ?? null,
      cognitiveLevel: question.cognitiveLevel ?? null,
      skillType: question.skillType ?? null,
      metadata: question.metadata as any,
      stimuli: stimuli.map((row) => ({
        locale: row.locale,
        stimulusType: row.stimulusType,
        orderIndex: Number(row.orderIndex ?? 0),
        content: row.content,
      })),
      options: options.map((option) => ({
        optionId: Number(option.id),
        value: option.value,
        label: option.label,
        content: option.content,
        orderIndex: Number(option.orderIndex ?? 0),
        metadata: option.metadata as any,
      })),
      explanations: explanations.map((explanation) => ({
        explanationType: explanation.explanationType,
        locale: explanation.locale,
        body: explanation.body,
        orderIndex: Number(explanation.orderIndex ?? 0),
        metadata: explanation.metadata as any,
      })),
      references: references.map((reference) => ({
        label: reference.label,
        url: reference.url ?? null,
        citation: reference.citation ?? null,
        orderIndex: Number(reference.orderIndex ?? 0),
        metadata: reference.metadata as any,
      })),
    })
  );

  return {
    attemptId,
    examSlug,
    topicSlug: topicSlug ?? null,
    questionCount: preparedQuestions.length,
    settings: { limit, topicSlug: topicSlug ?? null },
    questions: questionsPayload,
  };
}

export interface AttemptResponseInput {
  attemptId: number;
  userId: number;
  responses: Array<{
    attemptItemId: number;
    selectedOptionIds?: number[];
    selectedOptionValues?: string[];
    confidenceLevel?: number | null;
    whyResponse?: string | null;
    timeSpentMs?: number | null;
  }>;
  startedAtMs?: number | null;
  completedAtMs?: number | null;
}

export async function completePracticeAttempt({
  attemptId,
  userId,
  responses,
  startedAtMs,
  completedAtMs,
}: AttemptResponseInput) {
  if (!userId) {
    throw new QbankServiceError("unauthorized");
  }
  if (!attemptId) {
    throw new QbankServiceError("invalid_attempt_id");
  }

  const attempt = await db.query.qbankAttempts.findFirst({
    where: and(eq(qbankAttempts.id, attemptId), eq(qbankAttempts.userId, userId)),
  });

  if (!attempt) {
    throw new QbankServiceError("attempt_not_found");
  }

  if (attempt.status === "completed") {
    return {
      attemptId: Number(attempt.id),
      status: "already_completed" as const,
      correctCount: Number(attempt.scoreRaw ?? 0),
      totalCount: Number(attempt.questionCount ?? 0),
      scorePercent: Number(attempt.scorePercent ?? 0),
    };
  }

  const items = await db.query.qbankAttemptItems.findMany({
    where: eq(qbankAttemptItems.attemptId, attemptId),
    orderBy: (item, { asc }) => [asc(item.displayOrder)],
  });

  if (!items.length) {
    throw new QbankServiceError("attempt_items_missing");
  }

  const itemMap = new Map<number, (typeof items)[number]>();
  for (const item of items) {
    itemMap.set(Number(item.id), item);
  }

  const responseMap = new Map<number, AttemptResponseInput["responses"][number]>();
  for (const resp of responses ?? []) {
    const itemId = Number(resp.attemptItemId);
    if (!itemId || !itemMap.has(itemId)) continue;
    responseMap.set(itemId, resp);
  }

  let correctCount = 0;
  const totalCount = items.length;
  const itemUpdates: Array<typeof qbankAttemptItems.$inferInsert> = [];

  for (const item of items) {
    const itemId = Number(item.id);
    const response = responseMap.get(itemId);

    const seed = (item.promptSeed as any) ?? {};
    const correctIds: number[] = Array.isArray(seed.correctOptionIds)
      ? seed.correctOptionIds.map((value: any) => Number(value)).filter((value: number) => Number.isFinite(value))
      : [];
    const correctValues: string[] = Array.isArray(seed.correctOptionValues)
      ? seed.correctOptionValues.map((value: any) => String(value))
      : [];

    let selectedIds: number[] = [];
    let selectedValues: string[] = [];

    if (response) {
      if (Array.isArray(response.selectedOptionIds)) {
        selectedIds = response.selectedOptionIds.map((value) => Number(value)).filter((value) => Number.isFinite(value));
      }
      if (Array.isArray(response.selectedOptionValues)) {
        selectedValues = response.selectedOptionValues.map((value) => String(value));
      }
    }

    if (!selectedValues.length && correctValues.length && selectedIds.length === correctIds.length) {
      selectedValues = selectedIds.map(() => "");
    }

    const isCorrect = evaluateCorrectness({
      questionType: (seed.questionType as string) ?? "sba",
      correctIds,
      correctValues,
      selectedIds,
      selectedValues,
    });

    if (isCorrect) {
      correctCount += 1;
    }

    itemUpdates.push({
      id: itemId,
      attemptId,
      questionId: item.questionId,
      questionPublicId: item.questionPublicId,
      questionVersion: item.questionVersion,
      displayOrder: item.displayOrder,
      promptSeed: item.promptSeed,
      selectedOptions: selectedValues,
      response: {
        selectedOptionIds: selectedIds,
        selectedOptionValues: selectedValues,
      },
      isCorrect,
      scoreDelta: isCorrect ? 1 : 0,
      confidenceLevel: normalizeConfidence(response?.confidenceLevel),
      whyResponse: response?.whyResponse ?? null,
      timeSpentMs: response?.timeSpentMs ?? null,
      metadata: item.metadata,
    });
  }

  const scorePercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 10000) / 100 : 0;
  const durationSec = computeDurationSeconds({ responses, startedAtMs, completedAtMs });

  await db.transaction(async (tx) => {
    if (itemUpdates.length) {
      for (const update of itemUpdates) {
        await tx
          .update(qbankAttemptItems)
          .set({
            selectedOptions: update.selectedOptions ?? [],
            response: update.response ?? {},
            isCorrect: update.isCorrect ?? null,
            scoreDelta: update.scoreDelta ?? null,
            confidenceLevel: update.confidenceLevel ?? null,
            whyResponse: update.whyResponse ?? null,
            timeSpentMs: update.timeSpentMs ?? null,
            metadata: update.metadata ?? {},
          })
          .where(eq(qbankAttemptItems.id, update.id as number));
      }
    }

    await tx
      .update(qbankAttempts)
      .set({
        status: "completed",
        questionCount: totalCount,
        scoreRaw: correctCount,
        scorePercent,
        abilityEstimate: null,
        analytics: {
          correctCount,
          totalCount,
        },
        durationSec,
        completedAt: completedAtMs ? new Date(completedAtMs) : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(qbankAttempts.id, attemptId));
  });

  return {
    attemptId,
    status: "completed" as const,
    correctCount,
    totalCount,
    scorePercent,
  };
}

function evaluateCorrectness({
  questionType,
  correctIds,
  correctValues,
  selectedIds,
  selectedValues,
}: {
  questionType: string;
  correctIds: number[];
  correctValues: string[];
  selectedIds: number[];
  selectedValues: string[];
}): boolean {
  const isMulti = questionType === "multi";
  if (correctIds.length) {
    const correctSet = new Set(correctIds);
    const selectedSet = new Set(selectedIds);
    if (!isMulti) {
      if (selectedSet.size !== 1 || correctSet.size !== 1) return false;
      const [selected] = Array.from(selectedSet);
      const [correct] = Array.from(correctSet);
      return selected === correct;
    }
    if (selectedSet.size !== correctSet.size) return false;
    for (const id of correctSet) {
      if (!selectedSet.has(id)) return false;
    }
    return true;
  }

  const correctValueSet = new Set(correctValues);
  const selectedValueSet = new Set(selectedValues);
  if (!isMulti) {
    if (selectedValueSet.size !== 1 || correctValueSet.size !== 1) return false;
    const [selected] = Array.from(selectedValueSet);
    const [correct] = Array.from(correctValueSet);
    return selected === correct;
  }
  if (selectedValueSet.size !== correctValueSet.size) return false;
  for (const value of correctValueSet) {
    if (!selectedValueSet.has(value)) return false;
  }
  return true;
}

function normalizeConfidence(confidence?: number | null) {
  if (confidence == null || Number.isNaN(confidence)) return null;
  const rounded = Math.round(confidence);
  return Math.max(-2, Math.min(2, rounded));
}

function computeDurationSeconds({
  responses,
  startedAtMs,
  completedAtMs,
}: {
  responses: AttemptResponseInput["responses"];
  startedAtMs?: number | null;
  completedAtMs?: number | null;
}) {
  const totalTimeMs = responses
    .map((response) => (response?.timeSpentMs && Number.isFinite(response.timeSpentMs) ? Number(response.timeSpentMs) : 0))
    .reduce((sum, value) => sum + Math.max(0, value), 0);

  if (totalTimeMs > 0) {
    return Math.round(totalTimeMs / 1000);
  }

  if (startedAtMs && completedAtMs && completedAtMs > startedAtMs) {
    return Math.round((completedAtMs - startedAtMs) / 1000);
  }

  return null;
}

function groupByQuestion<T extends { questionId: number | string }>(rows: T[]) {
  const map = new Map<number, T[]>();
  for (const row of rows) {
    const key = Number(row.questionId);
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}

function shuffle<T>(input: T[]): T[] {
  for (let i = input.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [input[i], input[j]] = [input[j], input[i]];
  }
  return input;
}

