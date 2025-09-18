import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { clientIpFrom, rateAllow } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type LoginRow = {
  id: number;
  email: string | null;
  username: string | null;
  name: string | null;
  passwordHash: string | null;
  xp: number | null;
  level: number | null;
  isPremium: boolean | null;
  sessionVersion: number | null;
  lastPasswordChangeAt: Date | string | null;
  lastLogoutAllAt: Date | string | null;
};

function toIsoString(value: Date | string | null): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  const ms = parsed.getTime();
  if (!Number.isFinite(ms)) return String(value);
  return parsed.toISOString();
}

function formatSuccessMessage(payload: {
  email: string;
  username: string | null;
  user_id: number;
  is_premium: boolean;
  level: number;
  xp: number;
}): string {
  const { email, username, user_id, is_premium, level, xp } = payload;
  let msg = `Authenticated as ${email}`;
  if (username && username.toLowerCase() !== email.toLowerCase()) {
    msg += ` (username ${username})`;
  }
  msg += ` [user #${user_id}]`;
  msg += is_premium ? " Premium benefits active." : " Standard account.";
  if (Number.isFinite(level)) {
    msg += ` Level ${level} with ${xp} XP.`;
  }
  return msg;
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }
    const emailNorm = String(email).toLowerCase().trim();
    const ip = clientIpFrom(req);
    if (!rateAllow(`anki:login:ip:${ip}`, 10, 5 * 60_000)) {
      return NextResponse.json({ ok: false, error: "too_many_requests" }, { status: 429 });
    }
    if (!rateAllow(`anki:login:email:${emailNorm}`, 5, 5 * 60_000)) {
      return NextResponse.json({ ok: false, error: "too_many_requests" }, { status: 429 });
    }
    const row = (
      await db
        .select({
          id: users.id,
          email: users.email,
          username: users.username,
          name: users.name,
          passwordHash: users.passwordHash,
          xp: users.xp,
          level: users.level,
          isPremium: users.isPremium,
          sessionVersion: users.sessionVersion,
          lastPasswordChangeAt: users.lastPasswordChangeAt,
          lastLogoutAllAt: users.lastLogoutAllAt,
        })
        .from(users)
        .where(eq(users.email as any, emailNorm))
        .limit(1)
    )[0] as LoginRow | undefined;
    if (!row?.passwordHash) {
      return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
    }
    const ok = await bcrypt.compare(String(password), row.passwordHash);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "invalid_credentials" }, { status: 401 });
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ ok: false, error: "server_not_configured" }, { status: 500 });
    }
    const sv = Number(row.sessionVersion || 1);
    const token = jwt.sign(
      { userId: row.id, email: row.email || emailNorm, iss: "ems-anki", aud: "ems-client", sv },
      secret,
      { expiresIn: "2d" }
    );

    const nowSecs = Math.floor(Date.now() / 1000);
    const emailDisplay = row.email || emailNorm;
    const payload = {
      user_id: Number(row.id),
      email: emailDisplay,
      username: row.username || null,
      name: row.name || null,
      xp: Number(row.xp ?? 0),
      level: Number(row.level ?? 0),
      is_premium: Boolean(row.isPremium),
      session_version: sv,
      last_password_change_at: toIsoString(row.lastPasswordChangeAt),
      last_logout_all_at: toIsoString(row.lastLogoutAllAt),
      ts: nowSecs,
      account_found: true,
      login_identifier: emailNorm,
      requested: emailNorm,
      source: "api.anki.login",
    };
    const message = formatSuccessMessage(payload);
    const res = NextResponse.json({ ok: true, token, payload, message });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}
