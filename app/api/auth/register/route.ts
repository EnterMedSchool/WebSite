import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { clientIpFrom, rateAllow } from "@/lib/rate-limit";
import { basicBotChecks, captchaEnabled, verifyCaptchaToken } from "@/lib/bot";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { name, email, username, password, captchaToken, hp, spentMs } = await request.json();
    // Lightweight bot heuristics (honeypot + minimal time on form)
    if (!basicBotChecks({ hp, spentMs })) {
      return NextResponse.json({ error: "bot_detected" }, { status: 400 });
    }
    if (!email || !username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const emailNorm = String(email).toLowerCase().trim();
    const uname = String(username).trim();
    // Username policy: 3-30 chars, a-z 0-9 _ . -
    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(uname)) {
      return NextResponse.json({ error: "Invalid username. Use 3-30 letters, numbers, _ . -" }, { status: 400 });
    }

    // Basic password policy (tunable): 8+ chars
    if (String(password).length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Rate limit by IP and email to reduce abuse
    const ip = clientIpFrom(request);
    if (!rateAllow(`auth:register:ip:${ip}`, 5, 10 * 60_000)) {
      return NextResponse.json({ error: "Too many attempts, try again later" }, { status: 429 });
    }
    if (!rateAllow(`auth:register:email:${emailNorm}`, 3, 10 * 60_000)) {
      return NextResponse.json({ error: "Too many attempts, try again later" }, { status: 429 });
    }

    // Optional CAPTCHA
    if (captchaEnabled()) {
      const ok = await verifyCaptchaToken(captchaToken, request);
      if (!ok) return NextResponse.json({ error: "captcha_failed" }, { status: 400 });
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email as any, emailNorm), eq(users.username, uname)));
    if (existing.length) {
      return NextResponse.json({ error: "Email or username already in use" }, { status: 409 });
    }
    const rounds = Math.max(10, Math.min(14, Number(process.env.BCRYPT_ROUNDS || 12)));
    const hash = await bcrypt.hash(password, rounds);
    try {
      await db.insert(users).values({
        email: emailNorm,
        username: uname,
        name: name ?? uname,
        passwordHash: hash,
      });
    } catch (e: any) {
      // Handle possible race or DB-level unique constraint if present
      const msg = String(e?.message || e);
      if (/unique|duplicate|users_email_lower_uniq/i.test(msg)) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
      if (/users_username|username.*unique|duplicate/i.test(msg)) {
        return NextResponse.json({ error: "Username already in use" }, { status: 409 });
      }
      throw e;
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
