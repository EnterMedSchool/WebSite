import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: { sessionId: string } }
) {
  const sessionId = Number(params.sessionId);
  if (!Number.isFinite(sessionId)) return NextResponse.json({ error: "Invalid session id" }, { status: 400 });

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

