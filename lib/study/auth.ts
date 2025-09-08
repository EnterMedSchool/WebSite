import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";

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
    if (token?.sub) return Number(token.sub);
  } catch {}
  return null;
}

