import { sql } from "@/lib/db";
import { courseTokenName, signCourseEntitlement, verifyCourseEntitlement, extractTokenExpiry, COURSE_ENTITLEMENT_TTL_SECONDS } from "@/lib/lesson/entitlements";

export async function isCoursePaid(courseId: number): Promise<boolean> {
  try {
    const r = await sql`SELECT visibility, meta FROM courses WHERE id=${courseId} LIMIT 1`;
    const row = r.rows[0] as any;
    return computePaidFlag({ visibility: row?.visibility, access: row?.meta?.access, meta: row?.meta });
  } catch {
    return false;
  }
}

export async function hasCourseEntitlement(userId: number, courseId: number): Promise<boolean> {
  try {
    const r = await sql`SELECT 1 FROM user_course_entitlement WHERE user_id=${userId} AND course_id=${courseId} AND (ends_at IS NULL OR ends_at > NOW()) AND starts_at <= NOW() LIMIT 1`;
    return r.rows.length > 0;
  } catch {
    return false;
  }
}

type CourseMetaHint = { visibility?: string | null; access?: string | null; meta?: any };

type CookieStore = {
  get: (name: string) => { value: string } | undefined;
  set?: (name: string, value: string, options?: any) => void;
  delete?: (name: string, options?: any) => void;
};

function computePaidFlag(hint?: CourseMetaHint | null): boolean {
  if (!hint) return false;
  const visibility = String(hint.visibility || "").toLowerCase();
  const accessFromHint = hint.access != null ? String(hint.access).toLowerCase() : "";
  const accessFromMeta = hint.meta && typeof hint.meta === "object" ? String((hint.meta as any)?.access || "").toLowerCase() : "";
  const access = accessFromHint || accessFromMeta;
  const isPrivate = visibility === "private";
  const isPaid = access === "paid";
  return isPrivate || isPaid;
}

function parseCookieHeader(raw: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw) return out;
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    if (!key) continue;
    const val = part.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val || "");
  }
  return out;
}

type CourseAccessResult = {
  accessType: "free" | "paid";
  allowed: boolean;
  tokenToSet?: { value: string; expiresAt: number } | null;
  clearToken?: boolean;
};

type CourseAccessOptions = {
  req?: Request;
  cookieStore?: CookieStore;
  courseMeta?: CourseMetaHint;
};

export function entitlementCookieOptions(expiresAt: number, nowSeconds: number) {
  const maxAge = Math.max(60, expiresAt - nowSeconds);
  return {
    maxAge,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV !== "development",
    path: "/",
  };
}

export async function checkCourseAccess(
  userId: number,
  courseId: number,
  opts: CourseAccessOptions = {},
): Promise<CourseAccessResult> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const { req, cookieStore, courseMeta } = opts;
  const paid = courseMeta ? computePaidFlag(courseMeta) : await isCoursePaid(courseId);
  if (!paid) return { accessType: "free", allowed: true };
  if (!userId) return { accessType: "paid", allowed: false };

  const tokenName = courseTokenName(courseId);
  const cookieFromStore = cookieStore?.get(tokenName)?.value;
  const cookieFromHeader = !cookieFromStore && req ? parseCookieHeader(req.headers.get("cookie"))[tokenName] : undefined;
  const existingToken = cookieFromStore || cookieFromHeader || null;
  let clearToken = false;

  if (existingToken) {
    const valid = verifyCourseEntitlement(existingToken, courseId, userId);
    if (valid) {
      const expiresAt = extractTokenExpiry(existingToken) || nowSeconds + COURSE_ENTITLEMENT_TTL_SECONDS;
      const renewThreshold = COURSE_ENTITLEMENT_TTL_SECONDS / 4;
      if (expiresAt - nowSeconds <= renewThreshold) {
        const refreshed = signCourseEntitlement(courseId, userId);
        if (cookieStore?.set) {
          cookieStore.set(tokenName, refreshed.value, entitlementCookieOptions(refreshed.expiresAt, nowSeconds));
          return { accessType: "paid", allowed: true };
        }
        return { accessType: "paid", allowed: true, tokenToSet: refreshed };
      }
      return { accessType: "paid", allowed: true };
    }
    clearToken = true;
    if (cookieStore?.delete) {
      cookieStore.delete(tokenName, { path: "/" });
    }
  }

  const allowed = await hasCourseEntitlement(userId, courseId);
  if (!allowed) {
    return { accessType: "paid", allowed: false, clearToken };
  }

  const token = signCourseEntitlement(courseId, userId);
  if (cookieStore?.set) {
    cookieStore.set(tokenName, token.value, entitlementCookieOptions(token.expiresAt, nowSeconds));
    return { accessType: "paid", allowed: true };
  }

  return { accessType: "paid", allowed: true, tokenToSet: token };
}
