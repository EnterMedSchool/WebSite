import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { todos } from "@/drizzle/schema";
import { and, asc, desc, eq, sql as dsql } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await db
      .select()
      .from(todos)
      .where(eq(todos.userId as any, userId))
      .orderBy(asc(todos.done), asc(todos.position), asc(todos.id));
    return NextResponse.json({ data: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const label = String(body?.label || "").trim();
  if (!label) return NextResponse.json({ error: "label required" }, { status: 400 });
  try {
    const posRow = await db.execute<{ m: number }>(`SELECT COALESCE(MAX(position), 0) AS m FROM todos WHERE user_id = ${userId}` as any);
    const nextPos = Number(posRow.rows?.[0]?.m || 0) + 1;
    const ins = await db
      .insert(todos)
      .values({ userId, label, position: nextPos })
      .returning();
    return NextResponse.json({ data: ins[0] }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

