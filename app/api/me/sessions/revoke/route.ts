import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId(req);
    if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const now = new Date();
    await db.update(users).set({ sessionVersion: (users.sessionVersion as any) + 1, lastLogoutAllAt: now as any }).where(eq(users.id as any, userId));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}

