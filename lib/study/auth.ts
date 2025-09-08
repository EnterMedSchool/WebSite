import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

// Returns the authenticated user id or null. Tries NextAuth session first,
// then falls back to decoding the JWT cookie via getToken.
export async function requireUserId(req: Request): Promise<number | null> {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.userId || (session as any)?.user?.id;
    if (userId) return Number(userId);
  } catch {}
  try {
    const token = await getToken({ req: req as unknown as NextRequest, secret: process.env.NEXTAUTH_SECRET });
    const rawId = (token as any)?.userId || token?.sub;
    if (rawId && !Number.isNaN(Number(rawId))) return Number(rawId);
    const email = (token?.email || (token as any)?.user?.email) as string | undefined;
    if (email) {
      const row = (await db.select({ id: users.id }).from(users).where(eq(users.email as any, email.toLowerCase())))[0];
      if (row?.id) return Number(row.id);
    }
  } catch {}
  return null;
}
