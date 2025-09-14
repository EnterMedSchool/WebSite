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

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    const emailNorm = String(email).toLowerCase().trim();
    // Rate limit by IP and email (best-effort)
    const ip = clientIpFrom(req);
    if (!rateAllow(`anki:login:ip:${ip}`, 10, 5 * 60_000)) {
      return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
    }
    if (!rateAllow(`anki:login:email:${emailNorm}`, 5, 5 * 60_000)) {
      return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
    }
    const row = (
      await db
        .select()
        .from(users)
        .where(eq(users.email as any, emailNorm))
        .limit(1)
    )[0] as any;
    if (!row?.passwordHash) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    const ok = await bcrypt.compare(String(password), row.passwordHash);
    if (!ok) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return NextResponse.json({ error: "server_not_configured" }, { status: 500 });
    const sv = Number(row.sessionVersion || 1);
    const token = jwt.sign(
      { userId: row.id, email: row.email || emailNorm, iss: "ems-anki", aud: "ems-client", sv },
      secret,
      { expiresIn: "2d" }
    );
    const res = NextResponse.json({ token });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}
