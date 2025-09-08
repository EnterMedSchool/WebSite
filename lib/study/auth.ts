import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

async function getOrCreateUserIdByEmail(email: string, name?: string | null, image?: string | null) {
  const emailNorm = email.toLowerCase();
  const existing = (await db.select({ id: users.id }).from(users).where(eq(users.email as any, emailNorm)).limit(1))[0];
  if (existing?.id) return Number(existing.id);
  // Create minimal user row to map external auth to internal numeric id
  const base = (emailNorm.split("@")[0] || "user").slice(0, 80);
  let candidate = base;
  // ensure username uniqueness
  for (let i = 0; i < 5; i++) {
    const taken = (await db.select({ id: users.id }).from(users).where(eq(users.username, candidate)).limit(1))[0];
    if (!taken) break;
    candidate = `${base}${Math.floor(Math.random() * 1000)}`.slice(0, 80);
  }
  const inserted = await db
    .insert(users)
    .values({ username: candidate, name: name || candidate, email: emailNorm, image: image || null })
    .returning({ id: users.id });
  return Number(inserted[0].id);
}

// Returns the authenticated user id or null. Tries NextAuth session first,
// then falls back to decoding the JWT cookie via getToken.
export async function requireUserId(req: Request): Promise<number | null> {
  // 1) Try NextAuth server session first
  try {
    const session = await getServerSession(authOptions);
    const sUser: any = session as any;
    const email: string | undefined = sUser?.user?.email;
    const sid = sUser?.userId || sUser?.user?.id; // may be an external provider id (string)
    if (email) {
      return await getOrCreateUserIdByEmail(email, sUser?.user?.name, sUser?.user?.image);
    }
    // If no email but we have a numeric internal id and it exists, accept it
    if (sid && /^\d+$/.test(String(sid))) {
      const found = (await db.select({ id: users.id }).from(users).where(eq(users.id as any, Number(sid))).limit(1))[0];
      if (found?.id) return Number(found.id);
    }
  } catch {}

  // 2) Fallback: decode JWT cookie
  try {
    const token: any = await getToken({ req: req as unknown as NextRequest, secret: process.env.NEXTAUTH_SECRET });
    const email: string | undefined = token?.email || token?.user?.email;
    if (email) {
      return await getOrCreateUserIdByEmail(email, token?.name || token?.user?.name, token?.picture || token?.user?.image);
    }
    const raw = token?.userId || token?.sub;
    if (raw && /^\d+$/.test(String(raw))) {
      const found = (await db.select({ id: users.id }).from(users).where(eq(users.id as any, Number(raw))).limit(1))[0];
      if (found?.id) return Number(found.id);
    }
  } catch {}

  return null;
}
