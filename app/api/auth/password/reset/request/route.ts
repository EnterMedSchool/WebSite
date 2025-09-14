import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { clientIpFrom, rateAllow } from "@/lib/rate-limit";
import { issueToken } from "@/lib/auth/tokens";
import { basicBotChecks, captchaEnabled, verifyCaptchaToken } from "@/lib/bot";

export async function POST(req: Request) {
  try {
    const { email, captchaToken, hp, spentMs } = await req.json();
    if (!email) return NextResponse.json({ error: "missing_email" }, { status: 400 });
    if (!basicBotChecks({ hp, spentMs })) {
      return NextResponse.json({ error: "bot_detected" }, { status: 400 });
    }
    const emailNorm = String(email).toLowerCase().trim();

    const ip = clientIpFrom(req);
    if (!rateAllow(`auth:reset:ip:${ip}`, 10, 10 * 60_000)) {
      return NextResponse.json({ ok: true }, { status: 204 });
    }
    if (!rateAllow(`auth:reset:email:${emailNorm}`, 5, 60 * 60_000)) {
      return NextResponse.json({ ok: true }, { status: 204 });
    }

    const row = (await db.select({ id: users.id }).from(users).where(eq(users.email as any, emailNorm)).limit(1))[0];
    if (captchaEnabled()) {
      const ok = await verifyCaptchaToken(captchaToken, req);
      if (!ok) return NextResponse.json({ error: "captcha_failed" }, { status: 400 });
    }
    let url: string | undefined;
    if (row?.id) {
      const res = await issueToken({ purpose: "reset_password", email: emailNorm, userId: Number(row.id), ttlMinutes: 60, ip, userAgent: (req as any)?.headers?.get?.('user-agent') || undefined });
      url = res?.url;
    }
    const dev = String(process.env.EMAIL_DEV_MODE || "").trim();
    const devMode = dev === "1" || /^(true|yes)$/i.test(dev);
    if (devMode && url) return NextResponse.json({ ok: true, url });
    return NextResponse.json({ ok: true }, { status: 204 });
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}
