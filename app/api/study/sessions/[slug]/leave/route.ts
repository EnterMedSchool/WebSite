import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { studySessionParticipants, studySessions } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { emit } from "@/lib/study/sse";
import { StudyEvents } from "@/lib/study/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });
  const row = (await db.select({ id: studySessions.id }).from(studySessions).where(eq(studySessions.slug as any, params.slug)).limit(1))[0];
  if (!row) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const sessionId = Number(row.id);

  try {
    await db
      .delete(studySessionParticipants)
      .where(and(eq(studySessionParticipants.sessionId as any, sessionId), eq(studySessionParticipants.userId as any, userId)));

    emit(sessionId, StudyEvents.PresenceLeave, { userId });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to leave" }, { status: 500 });
  }
}
