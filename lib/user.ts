import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function resolveUserIdFromSession(): Promise<number> {
  try {
    const session = await getServerSession(authOptions as any);
    let userId = session && (session as any).userId ? Number((session as any).userId) : 0;
    if (!Number.isSafeInteger(userId) || userId <= 0 || userId > 2147483647) userId = 0;
    if (!userId && (session as any)?.user?.email) {
      const email = String((session as any).user.email).toLowerCase();
      const ur = await sql`SELECT id FROM users WHERE email=${email} LIMIT 1`;
      if (ur.rows[0]?.id) userId = Number(ur.rows[0].id);
    }
    return userId || 0;
  } catch {
    return 0;
  }
}

