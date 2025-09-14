import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { consumeToken } from "@/lib/auth/tokens";
import { clientIpFrom, rateAllow } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  // Optional convenience: if a browser hits the link, show a minimal UI message.
  const url = new URL((req as any).url || "http://localhost");
  if (url.searchParams.get("token")) {
    return NextResponse.json({ ok: true, message: "Token received. POST with { token, password } to set a new password." });
  }
  return NextResponse.json({ error: "missing_token" }, { status: 400 });
}

export async function POST(req: Request) {
  try {
    const ip = clientIpFrom(req);
    if (!rateAllow(`auth:reset_confirm:ip:${ip}`, 20, 10 * 60_000)) {
      return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
    }
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    if (String(password).length < 8) return NextResponse.json({ error: "weak_password" }, { status: 400 });
    const row = await consumeToken("reset_password", String(token));
    if (!row?.userId && !row?.email) return NextResponse.json({ error: "invalid_or_expired" }, { status: 400 });
    const userId = Number(row?.userId || 0);
    const email = (row?.email || "").toString();
    const rounds = Math.max(10, Math.min(14, Number(process.env.BCRYPT_ROUNDS || 12)));
    const hash = await bcrypt.hash(String(password), rounds);
    const now = new Date();
    if (userId) {
      await db.update(users).set({ passwordHash: hash, lastPasswordChangeAt: now as any, sessionVersion: (users.sessionVersion as any) + 1 }).where(eq(users.id as any, userId));
    } else if (email) {
      const row = (await db.select({ id: users.id }).from(users).where(eq(users.email as any, email)).limit(1))[0] as any;
      if (row?.id) {
        await db.update(users).set({ passwordHash: hash, lastPasswordChangeAt: now as any, sessionVersion: (users.sessionVersion as any) + 1 }).where(eq(users.id as any, row.id));
      } else {
        await db.update(users).set({ passwordHash: hash }).where(eq(users.email as any, email));
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}
