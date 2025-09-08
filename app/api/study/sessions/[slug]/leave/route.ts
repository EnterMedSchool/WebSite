import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { studySessionParticipants, studySessions } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { authGetServerSession } from "@/lib/auth";
import { publish } from "@/lib/study/pusher";
import { StudyEvents } from "@/lib/study/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const auth = await authGetServerSession();
  const userId = (auth as any)?.userId ? Number((auth as any).userId) : null;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const row = (await db.select({ id: studySessions.id }).from(studySessions).where(eq(studySessions.slug as any, params.slug)).limit(1))[0];
  if (!row) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const sessionId = Number(row.id);

  try {
    await db
      .delete(studySessionParticipants)
      .where(and(eq(studySessionParticipants.sessionId as any, sessionId), eq(studySessionParticipants.userId as any, userId)));

    await publish(sessionId, StudyEvents.PresenceLeave, { userId });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to leave" }, { status: 500 });
  }
}
