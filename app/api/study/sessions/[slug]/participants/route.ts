import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { studySessions } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const row = (await db.select({ id: studySessions.id }).from(studySessions).where(eq(studySessions.slug as any, params.slug)).limit(1))[0];
  if (!row) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const sessionId = Number(row.id);

  try {
    const result = await sql<{
      id: number;
      name: string | null;
      username: string | null;
      image: string | null;
    }>`
      SELECT u.id, u.name, u.username, u.image
      FROM study_session_participants p
      JOIN users u ON u.id = p.user_id
      WHERE p.session_id = ${sessionId}
      ORDER BY p.joined_at DESC
    `;
    return NextResponse.json({ data: result.rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load participants" }, { status: 500 });
  }
}
