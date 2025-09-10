import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireAdminEmail(): Promise<{ email: string } | null> {
  const session = await getServerSession(authOptions as any);
  const email = String((session as any)?.user?.email || "").toLowerCase();
  if (!email) return null;
  const allowList = (process.env.ADMIN_EMAILS || "entermedschool@gmail.com")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!allowList.includes(email)) return null;
  return { email };
}

