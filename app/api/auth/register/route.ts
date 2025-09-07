import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { name, email, username, password } = await request.json();
    if (!email || !username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const emailNorm = String(email).toLowerCase().trim();
    const uname = String(username).trim();

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email as any, emailNorm), eq(users.username, uname)));
    if (existing.length) {
      return NextResponse.json({ error: "Email or username already in use" }, { status: 409 });
    }
    const hash = await bcrypt.hash(password, 10);
    await db.insert(users).values({
      email: emailNorm,
      username: uname,
      name: name ?? uname,
      passwordHash: hash,
    });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}

