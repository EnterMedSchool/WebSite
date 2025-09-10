import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    const emailNorm = String(email).toLowerCase().trim();
    const row = (
      await db
        .select()
        .from(users)
        .where(eq(users.email as any, emailNorm))
        .limit(1)
    )[0];
    if (!row?.passwordHash) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    const ok = await bcrypt.compare(String(password), row.passwordHash);
    if (!ok) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return NextResponse.json({ error: "server_not_configured" }, { status: 500 });
    const token = jwt.sign({ userId: row.id, email: row.email }, secret, { expiresIn: "7d" });
    return NextResponse.json({ token });
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}

