"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { AttemptQuestionPayload } from "@/lib/qbank/service";

type Topic = {
  id: number;
  slug: string;
  title: string;
  blueprintCode?: string | null;
  depth: number;
  orderIndex: number;
  metadata: Record<string, unknown>;
};

type Section = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  orderIndex: number;
  metadata: Record<string, unknown>;
  topics: Topic[];
};

type ExamPayload = {
  slug: string;
  name: string;
  description?: string | null;
};

type AttemptSummary = {
  attemptId: number;
  status: "completed" | "already_completed";
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  details: Array<{
    attemptItemId: number;
    isCorrect: boolean;
    selectedOptionIds: number[];
    selectedOptionValues: string[];
    correctOptionIds: number[];
    correctOptionValues: string[];
  }>;
};

type PracticeAttempt = {
  attemptId: number;
  examSlug: string;
  topicSlug: string | null;
  questionCount: number;
  questions: AttemptQuestionPayload[];
};

type QbankPracticeClientProps = {
  exam: ExamPayload;
  sections: Section[];
  looseTopics: Topic[];
  isLoggedIn: boolean;
};

type ResponseEntry = {
  optionIds: number[];
  optionValues: string[];
};

const QUESTION_LIMIT_OPTIONS = [3, 5, 8, 10];
export default function QbankPracticeClient({ exam, sections, looseTopics, isLoggedIn }: QbankPracticeClientProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questionLimit, setQuestionLimit] = useState<number>(5);
  const [status, setStatus] = useState<"idle" | "loading" | "in_progress" | "review">("idle");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<PracticeAttempt | null>(null);
  const [responses, setResponses] = useState<Map<number, ResponseEntry>>(new Map());
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [summary, setSummary] = useState<AttemptSummary | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const topicOptions = useMemo(() => {
    const grouped = sections.flatMap((section) =>
      section.topics.map((topic) => ({
        ...topic,
        sectionSlug: section.slug,
        sectionName: section.name,
      }))
    );
    return [...grouped, ...looseTopics.map((topic) => ({ ...topic, sectionSlug: null, sectionName: null }))];
  }, [sections, looseTopics]);

  const detailByItemId = useMemo(() => {
    const map = new Map<number, AttemptSummary["details"][number]>();
    if (summary?.details) {
      for (const detail of summary.details) {
        map.set(detail.attemptItemId, detail);
      }
    }
    return map;
  }, [summary]);

  async function startAttempt() {
    if (!isLoggedIn) {
      setError("You need to sign in to start a practice set.");
      return;
    }

    setError(null);
    setStatus("loading");
    setAttempt(null);
    setSummary(null);
    setResponses(new Map());
    setCurrentIndex(0);

    try {
      const res = await fetch("/api/qbank/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examSlug: exam.slug,
          topicSlug: selectedTopic,
          limit: questionLimit,
        }),
      });

      if (!res.ok) {
        const data = await safeJson(res);
        setError(data?.error ? humanizeError(data.error) : "Failed to start attempt");
        setStatus("idle");
        return;
      }

      const data = (await res.json()) as { attempt: PracticeAttempt };
      setAttempt(data.attempt);
      setStartedAt(Date.now());
      setStatus("in_progress");
    } catch (err) {
      console.error("[qbank attempt start]", err);
      setError("Network error. Please try again.");
      setStatus("idle");
    }
  }

  async function submitAttempt() {
    if (!attempt) return;
    setStatus("loading");
    setError(null);

    const payload = {
      responses: attempt.questions.map((question) => {
        const entry = responses.get(question.attemptItemId);
        return {
          attemptItemId: question.attemptItemId,
          selectedOptionIds: entry?.optionIds ?? [],
          selectedOptionValues: entry?.optionValues ?? [],
        };
      }),
      startedAt: startedAt ?? undefined,
      completedAt: Date.now(),
    };

    try {
      const res = await fetch(`/api/qbank/attempts/${attempt.attemptId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await safeJson(res);
        setError(data?.error ? humanizeError(data.error) : "Unable to submit attempt");
        setStatus("in_progress");
        return;
      }

      const data = (await res.json()) as { summary: AttemptSummary };
      setSummary(data.summary);
      setStatus("review");
    } catch (err) {
      console.error("[qbank attempt complete]", err);
      setError("Network error while submitting. Please try again.");
      setStatus("in_progress");
    }
  }

  function resetSession() {
    setStatus("idle");
    setError(null);
    setAttempt(null);
    setSummary(null);
    setResponses(new Map());
    setCurrentIndex(0);
    setStartedAt(null);
  }

  const activeQuestion = attempt?.questions[currentIndex];
  const activeDetail = activeQuestion ? detailByItemId.get(activeQuestion.attemptItemId) : undefined;

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-3xl font-semibold text-slate-900">Practice {exam.name}</h2>
        {exam.description ? <p className="max-w-3xl text-slate-600">{exam.description}</p> : null}
      </section>

      {!isLoggedIn ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <p className="text-sm sm:text-base">
            Sign in to record your attempts and unlock mastery analytics.
            <Link href="/signin" className="ml-1 font-medium underline">
              Go to sign in
            </Link>
            .
          </p>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700">Focus topic</label>
            <select
              value={selectedTopic ?? ""}
              onChange={(event) => setSelectedTopic(event.target.value || null)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All topics</option>
              {topicOptions.map((topic) => (
                <option key={topic.slug} value={topic.slug}>
                  {topic.sectionName ? `${topic.sectionName} - ${topic.title}` : topic.title}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-40">
            <label className="block text-sm font-medium text-slate-700">Questions</label>
            <select
              value={questionLimit}
              onChange={(event) => setQuestionLimit(Number(event.target.value))}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {QUESTION_LIMIT_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={startAttempt}
            disabled={status === "loading"}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 sm:w-auto"
          >
            {status === "loading" ? "Preparing..." : "Start practice"}
          </button>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </section>

      {status === "in_progress" && attempt && activeQuestion ? (
        <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <QuestionCard
            question={activeQuestion}
            detail={activeDetail}
            response={responses.get(activeQuestion.attemptItemId)}
            onSelect={(optionId, optionValue, isMulti) =>
              setResponses((prev) => {
                const next = new Map(prev);
                const existing = next.get(activeQuestion.attemptItemId) ?? { optionIds: [], optionValues: [] };
                if (isMulti) {
                  const index = existing.optionIds.indexOf(optionId);
                  if (index >= 0) {
                    existing.optionIds = existing.optionIds.filter((value) => value !== optionId);
                    existing.optionValues = existing.optionValues.filter((value) => value !== optionValue);
                  } else {
                    existing.optionIds = [...existing.optionIds, optionId];
                    existing.optionValues = [...existing.optionValues, optionValue];
                  }
                } else {
                  existing.optionIds = [optionId];
                  existing.optionValues = [optionValue];
                }
                next.set(activeQuestion.attemptItemId, normalizeResponse(existing));
                return next;
              })
            }
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              Question {currentIndex + 1} of {attempt.questions.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
                disabled={currentIndex === 0}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              {currentIndex < attempt.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((index) => Math.min(attempt.questions.length - 1, index + 1))}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitAttempt}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Submit set
                </button>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {status === "review" && attempt && summary ? (
        <ReviewPanel attempt={attempt} summary={summary} responses={responses} onRetry={resetSession} />
      ) : null}
    </div>
  );
}
function QuestionCard({
  question,
  detail,
  response,
  onSelect,
}: {
  question: AttemptQuestionPayload;
  detail: AttemptSummary["details"][number] | undefined;
  response: ResponseEntry | undefined;
  onSelect: (optionId: number, optionValue: string, isMulti: boolean) => void;
}) {
  const isMulti = question.questionType === "multi";
  const selectedIds = new Set(response?.optionIds ?? []);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {question.stimuli.map((block) => (
          <StimulusBlockView key={`${question.attemptItemId}-${block.orderIndex}`} block={block} />
        ))}
      </div>

      <div className="space-y-2">
        {question.options.map((option) => {
          const isSelected = selectedIds.has(option.optionId);
          const showResult = Boolean(detail);
          const isCorrect = detail ? detail.correctOptionIds.includes(option.optionId) : false;
          const isUserChoice = detail ? detail.selectedOptionIds.includes(option.optionId) : isSelected;

          return (
            <button
              key={option.optionId}
              type="button"
              onClick={() => onSelect(option.optionId, option.value ?? String(option.optionId), isMulti)}
              disabled={Boolean(detail)}
              className={optionButtonClasses({ isSelected, showResult, isCorrect, isUserChoice })}
            >
              <span className="font-medium">{option.value ?? option.label ?? `Option ${option.orderIndex + 1}`}</span>
              {option.label && option.label !== option.value ? (
                <span className="ml-2 text-sm text-slate-500">{option.label}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {detail ? (
        <div className="space-y-4 rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between text-sm text-emerald-800">
            <span>{detail.isCorrect ? "Correct" : "Not quite yet"}</span>
            <span>
              {detail.correctOptionIds.length > 1 ? "Correct answers" : "Correct answer"}: {detail.correctOptionIds.length || detail.correctOptionValues.length ? formatAnswerList(detail, question) : "-"}
            </span>
          </div>
          {question.explanations.length ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">Explanation</h3>
              {question.explanations.map((explanation) => (
                <p key={`${question.attemptItemId}-${explanation.orderIndex}`} className="text-sm text-slate-600">
                  {renderMarkdownText(explanation.body)}
                </p>
              ))}
            </div>
          ) : null}
          {question.references.length ? (
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-700">References</h3>
              <ul className="list-inside list-disc text-sm text-slate-600">
                {question.references.map((reference, index) => (
                  <li key={`${question.attemptItemId}-ref-${index}`}>
                    {reference.url ? (
                      <a href={reference.url} target="_blank" rel="noreferrer" className="underline">
                        {reference.label}
                      </a>
                    ) : (
                      reference.label
                    )}
                    {reference.citation ? <span className="ml-1 text-slate-500">{reference.citation}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ReviewPanel({
  attempt,
  summary,
  responses,
  onRetry,
}: {
  attempt: PracticeAttempt;
  summary: AttemptSummary;
  responses: Map<number, ResponseEntry>;
  onRetry: () => void;
}) {
  const accuracyPercent = Math.round((summary.scorePercent + Number.EPSILON) * 100) / 100;

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
        <div className="text-sm uppercase tracking-wide">Session complete</div>
        <div className="mt-2 text-3xl font-semibold">
          {summary.correctCount} / {summary.totalCount} correct
        </div>
        <div className="text-sm text-emerald-800">Accuracy {accuracyPercent}%</div>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Start another set
        </button>
      </div>

      <div className="space-y-4">
        {attempt.questions.map((question) => (
          <div key={question.attemptItemId} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <QuestionCard
              question={question}
              detail={summary.details.find((detail) => detail.attemptItemId === question.attemptItemId)}
              response={responses.get(question.attemptItemId)}
              onSelect={() => {}}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function StimulusBlockView({ block }: { block: AttemptQuestionPayload["stimuli"][number] }) {
  const content = block.content as Record<string, unknown> | null;
  if (block.stimulusType === "data" && content) {
    const headers = Array.isArray((content as any).headers) ? (content as any).headers : [];
    const rows = Array.isArray((content as any).rows) ? (content as any).rows : [];
    return (
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          {headers.length ? (
            <thead className="bg-slate-100">
              <tr>
                {headers.map((header: any, index: number) => (
                  <th key={index} className="px-3 py-2 font-semibold text-slate-700">
                    {String(header)}
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          {rows.length ? (
            <tbody className="divide-y divide-slate-100">
              {rows.map((row: any[], rowIndex: number) => (
                <tr key={rowIndex}>
                  {row.map((cell: any, cellIndex: number) => (
                    <td key={cellIndex} className="whitespace-nowrap px-3 py-2 text-slate-700">
                      {String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ) : null}
        </table>
      </div>
    );
  }

  if (content && typeof content === "object" && "value" in content) {
    return <p className="text-base text-slate-800">{String((content as any).value)}</p>;
  }

  return <p className="text-base text-slate-800">{String(block.content ?? "")}</p>;
}

function optionButtonClasses({
  isSelected,
  showResult,
  isCorrect,
  isUserChoice,
}: {
  isSelected: boolean;
  showResult: boolean;
  isCorrect: boolean;
  isUserChoice: boolean;
}) {
  if (showResult) {
    if (isCorrect) {
      return "flex w-full items-start justify-between rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-left text-sm font-medium text-emerald-900";
    }
    if (isUserChoice) {
      return "flex w-full items-start justify-between rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-left text-sm font-medium text-rose-900";
    }
    return "flex w-full items-start justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-600";
  }

  return isSelected
    ? "flex w-full items-start justify-between rounded-md border border-indigo-500 bg-indigo-50 px-3 py-2 text-left text-sm text-indigo-700"
    : "flex w-full items-start justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50";
}
function normalizeResponse(entry: ResponseEntry): ResponseEntry {
  const uniquePairs = entry.optionIds.map((id, index) => ({ id, value: entry.optionValues[index] ?? "" }));
  const uniqueMap = new Map<number, string>();
  for (const pair of uniquePairs) {
    if (!uniqueMap.has(pair.id)) {
      uniqueMap.set(pair.id, pair.value ?? "");
    }
  }
  return {
    optionIds: Array.from(uniqueMap.keys()),
    optionValues: Array.from(uniqueMap.values()),
  };
}

function formatAnswerList(detail: AttemptSummary["details"][number], question: AttemptQuestionPayload) {
  if (detail.correctOptionIds.length) {
    const labelMap = new Map<number, string>();
    for (const option of question.options) {
      labelMap.set(option.optionId, option.value ?? option.label ?? String(option.optionId));
    }
    return detail.correctOptionIds
      .map((id) => labelMap.get(id) ?? detail.correctOptionValues[detail.correctOptionIds.indexOf(id)] ?? String(id))
      .join(", ");
  }
  return detail.correctOptionValues.join(", ");
}

function renderMarkdownText(body: unknown) {
  if (body && typeof body === "object" && "markdown" in (body as any)) {
    return String((body as any).markdown);
  }
  return String(body ?? "");
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function humanizeError(code: string) {
  switch (code) {
    case "unauthorized":
      return "You need to sign in to practice.";
    case "exam_not_found":
      return "Exam not found.";
    case "topic_not_found":
      return "Selected topic is unavailable.";
    case "no_questions_available":
      return "No questions available for that selection yet.";
    default:
      return "Something went wrong. Please try again.";
  }
}

