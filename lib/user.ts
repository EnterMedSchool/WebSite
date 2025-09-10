import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";

// Returns the local DB user id for the current session, preferring email mapping.
export async function resolveUserIdFromSession(): Promise<number> {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) return 0;

    // Prefer stable email → DB id mapping (works even if token.userId is a provider id)
    const email = (session as any)?.user?.email ? String((session as any).user.email).toLowerCase() : "";
    if (email) {
      const ur = await sql`SELECT id FROM users WHERE lower(email)=${email} LIMIT 1`;
      const id = ur.rows[0]?.id ? Number(ur.rows[0].id) : 0;
      if (Number.isSafeInteger(id) && id > 0 && id <= 2147483647) return id;
    }

    // Fallback: try token userId if it is a valid 32-bit integer (local DB id)
    const raw = (session as any).userId;
    const num = typeof raw === 'string' || typeof raw === 'number' ? Number(raw) : 0;
    if (Number.isSafeInteger(num) && num > 0 && num <= 2147483647) return num;

    return 0;
  } catch {
    return 0;
  }
}
