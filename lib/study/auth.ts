import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

export async function getOrCreateUserIdByEmail(email: string, name?: string | null, image?: string | null) {
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
  // 0) Mobile: Authorization: Bearer <jwt>
  try {
    const authz = (req as any)?.headers?.get?.("authorization") || (req as any).headers?.authorization;
    if (authz && typeof authz === "string" && authz.startsWith("Bearer ")) {
      const token = authz.slice(7).trim();
      if (token) {
        const decoded: any = jwt.verify(token, process.env.NEXTAUTH_SECRET as string);
        const iss = String(decoded?.iss || "");
        const aud = String(decoded?.aud || "");
        if (iss && iss !== "ems-anki") return null;
        if (aud && aud !== "ems-client") return null;
        const uid = Number(decoded?.userId || decoded?.sub);
        if (Number.isFinite(uid) && uid > 0) {
          const svToken = Number(decoded?.sv || 1);
          const row = (await db.select({ sv: users.sessionVersion }).from(users).where(eq(users.id as any, uid)).limit(1))[0] as any;
          if (!row?.sv || svToken !== Number(row.sv)) return null;
          return uid;
        }
      }
    }
  } catch {}

  // 1) Decode NextAuth JWT cookie and validate sessionVersion
  try {
    const token: any = await getToken({ req: req as unknown as NextRequest, secret: process.env.NEXTAUTH_SECRET });
    const email: string | undefined = token?.email || token?.user?.email;
    const uidRaw = token?.userId || token?.sub;
    const uid = uidRaw && /^\d+$/.test(String(uidRaw)) ? Number(uidRaw) : 0;
    const svToken = Number(token?.sv || 1);
    if (uid > 0) {
      const row = (await db.select({ sv: users.sessionVersion }).from(users).where(eq(users.id as any, uid)).limit(1))[0] as any;
      if (!row?.sv || svToken !== Number(row.sv)) return null;
      return uid;
    }
    if (email) {
      const existing = (await db.select({ id: users.id, sv: users.sessionVersion }).from(users).where(eq(users.email as any, String(email).toLowerCase())).limit(1))[0] as any;
      if (existing?.id) {
        if (svToken !== Number(existing.sv || 1)) return null;
        return Number(existing.id);
      }
      // No prior user: create minimal mapping
      return await getOrCreateUserIdByEmail(email, token?.name || token?.user?.name, token?.picture || token?.user?.image);
    }
  } catch {}

  // 2) Fallback: NextAuth server session (no sv available)
  try {
    const session = await getServerSession(authOptions);
    const sUser: any = session as any;
    const email: string | undefined = sUser?.user?.email;
    const sid = sUser?.userId || sUser?.user?.id; // may be an external provider id (string)
    if (sid && /^\d+$/.test(String(sid))) {
      const found = (await db.select({ id: users.id }).from(users).where(eq(users.id as any, Number(sid))).limit(1))[0];
      if (found?.id) return Number(found.id);
    }
    if (email) {
      return await getOrCreateUserIdByEmail(email, sUser?.user?.name, sUser?.user?.image);
    }
  } catch {}

  return null;
}

// Helper for Server Components: resolve current user id using NextAuth session only
export async function currentUserIdServer(): Promise<number | null> {
  try {
    const session = await getServerSession(authOptions);
    const sUser: any = session as any;
    const email: string | undefined = sUser?.user?.email;
    if (email) {
      return await getOrCreateUserIdByEmail(email, sUser?.user?.name, sUser?.user?.image);
    }
    const sid = sUser?.userId || sUser?.user?.id;
    if (sid && /^\d+$/.test(String(sid))) {
      const found = (await db.select({ id: users.id }).from(users).where(eq(users.id as any, Number(sid))).limit(1))[0];
      if (found?.id) return Number(found.id);
    }
  } catch {}
  return null;
}
