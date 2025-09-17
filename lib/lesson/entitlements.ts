import crypto from "node:crypto";

const COOKIE_PREFIX = "ems_entitled_course_";
export const COURSE_ENTITLEMENT_TTL_SECONDS = 60 * 60 * 24; // 24 hours

type TokenParts = { courseId: number; userId: number; expiresAt: number; signature: string };

function ensureSecret(): string {
  const secret = process.env.COURSE_ENTITLEMENT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing COURSE_ENTITLEMENT_SECRET or NEXTAUTH_SECRET for entitlement tokens");
  }
  return secret;
}

export function courseTokenName(courseId: number): string {
  return `${COOKIE_PREFIX}${courseId}`;
}

function parseToken(raw: string): TokenParts | null {
  if (!raw || typeof raw !== "string") return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const [courseIdRaw, userIdRaw, expRaw] = payload.split(":");
  const courseId = Number(courseIdRaw);
  const userId = Number(userIdRaw);
  const expiresAt = Number(expRaw);
  if (!Number.isFinite(courseId) || !Number.isFinite(userId) || !Number.isFinite(expiresAt)) return null;
  return { courseId, userId, expiresAt, signature };
}

function signPayload(payload: string): string {
  const secret = ensureSecret();
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signCourseEntitlement(courseId: number, userId: number, expiresAtSeconds?: number) {
  const exp = expiresAtSeconds && Number.isFinite(expiresAtSeconds)
    ? Math.floor(expiresAtSeconds)
    : Math.floor(Date.now() / 1000) + COURSE_ENTITLEMENT_TTL_SECONDS;
  const payload = `${courseId}:${userId}:${exp}`;
  const signature = signPayload(payload);
  return { value: `${payload}.${signature}`, expiresAt: exp };
}

function safeEqual(a: string, b: string): boolean {
  try {
    const aa = Buffer.from(a);
    const bb = Buffer.from(b);
    if (aa.length !== bb.length) return false;
    return crypto.timingSafeEqual(aa, bb);
  } catch {
    return false;
  }
}

export function verifyCourseEntitlement(token: string, courseId: number, userId: number): boolean {
  const parsed = parseToken(token);
  if (!parsed) return false;
  if (parsed.courseId !== courseId || parsed.userId !== userId) return false;
  if (parsed.expiresAt < Math.floor(Date.now() / 1000)) return false;
  const payload = `${parsed.courseId}:${parsed.userId}:${parsed.expiresAt}`;
  const expected = signPayload(payload);
  return safeEqual(parsed.signature, expected);
}

export function extractTokenExpiry(token: string): number | null {
  const parsed = parseToken(token);
  return parsed ? parsed.expiresAt : null;
}
