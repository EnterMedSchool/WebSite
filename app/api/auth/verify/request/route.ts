import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { issueToken } from "@/lib/auth/tokens";
import { clientIpFrom, rateAllow } from "@/lib/rate-limit";
import { basicBotChecks, captchaEnabled, verifyCaptchaToken } from "@/lib/bot";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    const email = String((session as any)?.user?.email || "").toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }
    const ip = clientIpFrom(req);
    if (!rateAllow(`auth:verify:ip:${ip}`, 10, 10 * 60_000)) {
      return NextResponse.json({ ok: true }, { status: 204 });
    }
    if (!rateAllow(`auth:verify:email:${email}`, 5, 60 * 60_000)) {
      return NextResponse.json({ ok: true }, { status: 204 });
    }
    // Optional: accept lightweight bot checks + captcha if enabled
    try {
      const { captchaToken, hp, spentMs } = await req.json().catch(() => ({ }));
      if (!basicBotChecks({ hp, spentMs })) {
        return NextResponse.json({ error: "bot_detected" }, { status: 400 });
      }
      if (captchaEnabled()) {
        const ok = await verifyCaptchaToken(captchaToken, req);
        if (!ok) return NextResponse.json({ error: "captcha_failed" }, { status: 400 });
      }
    } catch {}
    const res = await issueToken({ purpose: "verify_email", email, ttlMinutes: 60 * 24, ip, userAgent: (req as any)?.headers?.get?.('user-agent') || undefined });
    const dev = String(process.env.EMAIL_DEV_MODE || "").trim();
    const devMode = dev === "1" || /^(true|yes)$/i.test(dev);
    if (devMode && res) {
      return NextResponse.json({ ok: true, url: res.url });
    }
    return NextResponse.json({ ok: true }, { status: 204 });
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}
