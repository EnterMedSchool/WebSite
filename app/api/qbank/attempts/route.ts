import { NextResponse } from "next/server";

import { QbankServiceError, createPracticeAttempt } from "@/lib/qbank/service";
import { requireUserId } from "@/lib/study/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const examSlug = typeof payload?.examSlug === "string" ? payload.examSlug.trim() : "";
  if (!examSlug) {
    return NextResponse.json({ error: "missing_exam_slug" }, { status: 400 });
  }

  const topicSlug = typeof payload?.topicSlug === "string" && payload.topicSlug.trim().length > 0 ? payload.topicSlug.trim() : undefined;
  const rawLimit = Number(payload?.limit);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(20, Math.round(rawLimit)) : undefined;

  try {
    const attempt = await createPracticeAttempt({
      userId,
      examSlug,
      topicSlug: topicSlug ?? null,
      limit,
    });

    return NextResponse.json({ attempt });
  } catch (error) {
    if (error instanceof QbankServiceError) {
      const status =
        error.code === "exam_not_found"
          ? 404
          : error.code === "topic_not_found"
          ? 404
          : error.code === "no_questions_available"
          ? 409
          : 400;
      return NextResponse.json({ error: error.code }, { status });
    }
    console.error("[qbank attempt create]", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
