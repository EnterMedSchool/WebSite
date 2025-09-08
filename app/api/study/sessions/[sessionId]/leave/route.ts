import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { studySessionParticipants } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { authGetServerSession } from "@/lib/auth";
import { publish } from "@/lib/study/pusher";
import { StudyEvents } from "@/lib/study/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  _req: Request,
  { params }: { params: { sessionId: string } }
) {
  const auth = await authGetServerSession();
  const userId = (auth as any)?.userId ? Number((auth as any).userId) : null;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessionId = Number(params.sessionId);
  if (!Number.isFinite(sessionId)) return NextResponse.json({ error: "Invalid session id" }, { status: 400 });

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

