import crypto from "crypto";
import { db } from "@/lib/db";
import { verificationTokens, users } from "@/drizzle/schema";
import { eq, and, isNull, gt } from "drizzle-orm";

type Purpose = "verify_email" | "reset_password";

function baseUrl(): string {
  const raw = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return String(raw).replace(/\/$/, "");
}

export function makeToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

export async function issueToken(opts: {
  purpose: Purpose;
  email?: string | null;
  userId?: number | null;
  ttlMinutes?: number;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<{ token: string; url: string; expiresAt: Date } | null> {
  const { token, hash } = makeToken();
  const now = new Date();
  const ttl = Math.max(5, Number(opts.ttlMinutes || 60));
  const expiresAt = new Date(now.getTime() + ttl * 60_000);
  const email = opts.email ? String(opts.email).toLowerCase() : null;
  const userId = opts.userId && Number.isFinite(Number(opts.userId)) ? Number(opts.userId) : null;
  try {
    await db.insert(verificationTokens).values({
      email: email || null,
      userId: userId || null,
      purpose: opts.purpose,
      tokenHash: hash,
      expiresAt,
      ip: opts.ip || null,
      userAgent: opts.userAgent || null,
    });
  } catch {
    // swallow duplicate insert errors; caller can retry
  }
  let urlPath = "";
  if (opts.purpose === "verify_email") urlPath = `/api/auth/verify?token=${token}`;
  else if (opts.purpose === "reset_password") urlPath = `/api/auth/password/reset/confirm?token=${token}`;
  const url = `${baseUrl()}${urlPath}`;
  return { token, url, expiresAt };
}

export async function consumeToken(purpose: Purpose, token: string): Promise<null | {
  id: number;
  email: string | null;
  userId: number | null;
}> {
  const hash = crypto.createHash("sha256").update(String(token)).digest("hex");
  const now = new Date();
  try {
    const row = (await db
      .select()
      .from(verificationTokens)
      .where(and(
        eq(verificationTokens.tokenHash as any, hash),
        eq(verificationTokens.purpose as any, purpose),
        isNull(verificationTokens.consumedAt as any),
        gt(verificationTokens.expiresAt as any, now as any),
      ))
      .limit(1))[0] as any;
    if (!row) return null;
    await db
      .update(verificationTokens)
      .set({ consumedAt: now })
      .where(eq(verificationTokens.id as any, row.id));
    return { id: Number(row.id), email: row.email || null, userId: row.userId ? Number(row.userId) : null };
  } catch {
    return null;
  }
}

export async function markEmailVerified(emailOrId: { email?: string | null; userId?: number | null }): Promise<boolean> {
  try {
    if (emailOrId.email) {
      await db.update(users)
        .set({ emailVerified: new Date() as any })
        .where(eq(users.email as any, String(emailOrId.email).toLowerCase()));
      return true;
    }
    if (emailOrId.userId) {
      await db.update(users)
        .set({ emailVerified: new Date() as any })
        .where(eq(users.id as any, Number(emailOrId.userId)));
      return true;
    }
  } catch {}
  return false;
}

