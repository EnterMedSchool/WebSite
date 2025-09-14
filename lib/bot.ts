import { clientIpFrom } from "@/lib/rate-limit";

export function captchaEnabled(): boolean {
  const secret = String(process.env.TURNSTILE_SECRET_KEY || "").trim();
  return !!secret;
}

export async function verifyCaptchaToken(token: string | null | undefined, req?: Request): Promise<boolean> {
  try {
    if (!captchaEnabled()) return true; // disabled -> pass
    const secret = String(process.env.TURNSTILE_SECRET_KEY);
    const body = new URLSearchParams();
    body.append("secret", secret);
    body.append("response", String(token || ""));
    const ip = req ? clientIpFrom(req) : undefined;
    if (ip) body.append("remoteip", ip);
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      // Avoid Next's fetch caching
      cache: "no-store",
    });
    if (!resp.ok) return false;
    const json: any = await resp.json();
    return !!json?.success;
  } catch {
    // Fail closed when enabled and token present; otherwise fail open to reduce friction
    return false;
  }
}

export function basicBotChecks(input: { hp?: string | null | undefined; spentMs?: any }, minMs = 800): boolean {
  try {
    const hp = (input?.hp ?? "").toString();
    if (hp.trim().length > 0) return false; // honeypot filled -> bot
    const spent = Number(input?.spentMs ?? 0);
    if (!Number.isFinite(spent) || spent < minMs) return false;
    return true;
  } catch {
    return false;
  }
}

