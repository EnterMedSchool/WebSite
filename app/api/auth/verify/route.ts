import { NextResponse } from "next/server";
import { consumeToken, markEmailVerified } from "@/lib/auth/tokens";

export async function GET(req: Request) {
  try {
    const url = new URL((req as any).url || "http://localhost");
    const token = url.searchParams.get("token");
    if (!token) return NextResponse.json({ error: "missing_token" }, { status: 400 });
    const row = await consumeToken("verify_email", token);
    if (!row) return NextResponse.json({ error: "invalid_or_expired" }, { status: 400 });
    await markEmailVerified({ email: row.email, userId: row.userId || undefined });
    const redirectTo = url.searchParams.get("redirect") || "/signin?verified=1";
    return NextResponse.redirect(new URL(redirectTo, url.origin));
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}

