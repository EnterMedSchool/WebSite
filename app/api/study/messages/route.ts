import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { studyMessages } from "@/drizzle/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { emit } from "@/lib/study/sse";
import { StudyEvents } from "@/lib/study/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = Number(url.searchParams.get("sessionId"));
  if (!Number.isFinite(sessionId)) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  try {
    const result = await sql<{
      id: number;
      session_id: number;
      user_id: number;
      content: string;
      created_at: string;
      name: string | null;
      image: string | null;
      username: string | null;
    }>`
      SELECT m.id, m.session_id, m.user_id, m.content, m.created_at,
             u.name, u.image, u.username
      FROM study_messages m
      JOIN users u ON u.id = m.user_id
      WHERE m.session_id = ${sessionId}
      ORDER BY m.created_at ASC
    `;
    const data = result.rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      userId: r.user_id,
      content: r.content,
      createdAt: r.created_at,
      user: { id: r.user_id, name: r.name, image: r.image, username: r.username },
    }));
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized", code: "NO_SESSION" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const content = (body?.content || "").toString().trim();
  const sessionId = Number(body?.sessionId);
  if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });
  if (!Number.isFinite(sessionId)) return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  try {
    const inserted = await db
      .insert(studyMessages)
      .values({ content, sessionId, userId })
      .returning({ id: studyMessages.id, content: studyMessages.content, sessionId: studyMessages.sessionId, userId: studyMessages.userId, createdAt: studyMessages.createdAt });
    const msg = inserted[0];
    // enrich with user info
    const ures = await sql<{ name: string | null; image: string | null; username: string | null }>`SELECT name, image, username FROM users WHERE id = ${userId} LIMIT 1`;
    const user = ures.rows?.[0] || { name: null, image: null, username: null };
    const payload = { ...msg, user: { id: userId, name: user.name, image: user.image, username: user.username } } as any;
    emit(sessionId, StudyEvents.MessageNew, payload);
    return NextResponse.json({ data: payload }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to post" }, { status: 500 });
  }
}
