import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireAdminEmail(): Promise<{ email: string } | null> {
  // Be resilient in production: if NextAuth/env misconfig causes getServerSession
  // to throw, do not crash the Server Component — just deny access.
  let email: string | null = null;
  try {
    const session = await getServerSession(authOptions as any);
    email = String((session as any)?.user?.email || "").toLowerCase() || null;
  } catch {
    // swallow — we treat as unauthenticated
    email = null;
  }
  if (!email) return null;
  const allowList = (process.env.ADMIN_EMAILS || "entermedschool@gmail.com")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!allowList.includes(email)) return null;
  return { email };
}
