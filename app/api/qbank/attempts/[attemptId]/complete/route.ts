import { NextResponse } from "next/server";

import { QbankServiceError, AttemptResponseInput, completePracticeAttempt } from "@/lib/qbank/service";
import { requireUserId } from "@/lib/study/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { attemptId: string } }) {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const attemptId = Number(params.attemptId);
  if (!Number.isFinite(attemptId) || attemptId <= 0) {
    return NextResponse.json({ error: "invalid_attempt_id" }, { status: 400 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const rawResponses: any[] = Array.isArray(payload?.responses) ? payload.responses : [];
  const responses: AttemptResponseInput["responses"] = rawResponses
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const itemId = Number((entry as any).attemptItemId);
      if (!Number.isFinite(itemId) || itemId <= 0) return null;
      const selectedOptionIds = Array.isArray(entry.selectedOptionIds)
        ? entry.selectedOptionIds
            .map((value: unknown) => Number(value))
            .filter((value) => Number.isFinite(value) && value > 0)
        : undefined;
      const selectedOptionValues = Array.isArray(entry.selectedOptionValues)
        ? entry.selectedOptionValues.map((value: unknown) => String(value))
        : undefined;
      const confidenceLevel = entry.confidenceLevel != null ? Number(entry.confidenceLevel) : null;
      const timeSpentMs = entry.timeSpentMs != null ? Number(entry.timeSpentMs) : null;
      const whyResponse = typeof entry.whyResponse === "string" ? entry.whyResponse : undefined;
      return {
        attemptItemId: itemId,
        selectedOptionIds,
        selectedOptionValues,
        confidenceLevel,
        timeSpentMs,
        whyResponse,
      };
    })
    .filter((entry): entry is AttemptResponseInput["responses"][number] => Boolean(entry));

  const startedAtMs = payload?.startedAt ? Number(payload.startedAt) : undefined;
  const completedAtMs = payload?.completedAt ? Number(payload.completedAt) : undefined;

  try {
    const summary = await completePracticeAttempt({
      attemptId,
      userId,
      responses,
      startedAtMs: Number.isFinite(startedAtMs) ? startedAtMs : undefined,
      completedAtMs: Number.isFinite(completedAtMs) ? completedAtMs : undefined,
    });
    return NextResponse.json({ summary });
  } catch (error) {
    if (error instanceof QbankServiceError) {
      const status =
        error.code === "attempt_not_found" ? 404 : error.code === "attempt_items_missing" ? 409 : 400;
      return NextResponse.json({ error: error.code }, { status });
    }
    console.error("[qbank attempt complete]", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
