import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessons } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/study/auth";
import { checkCourseAccess, entitlementCookieOptions } from "@/lib/lesson/access";
import { courseTokenName } from "@/lib/lesson/entitlements";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = String(params.slug || "");
    if (!slug) return NextResponse.json({ html: "" });
    const row = (await db
      .select({ body: lessons.body, courseId: lessons.courseId })
      .from(lessons)
      .where(eq(lessons.slug as any, slug))
      .limit(1))[0];
    const body = String((row as any)?.body || "");
    if (!body) return NextResponse.json({ html: "" });

    let accessTokenToSet: { value: string; expiresAt: number } | null = null;

    // Paid course gating: if course is paid and user lacks entitlement, deny and throttle with cookie
    try {
      const courseId = Number((row as any)?.courseId || 0);
      if (courseId) {
        const userId = await requireUserId(req);
        const access = await checkCourseAccess(userId || 0, courseId, { req });
        if (access.accessType === 'paid' && !access.allowed) {
          const res = NextResponse.json({ error: 'forbidden', reason: 'paid_course' }, { status: 403 });
          res.cookies.set(`ems_paid_denied_${courseId}`, String(Date.now()), { maxAge: 600, path: '/' });
          try { res.cookies.set(`ems_paid_denied_l_${slug}`, '1', { maxAge: 600, path: '/' }); } catch {}
          if (access.clearToken) {
            try { res.cookies.set(courseTokenName(courseId), '', { maxAge: 0, path: '/' }); } catch {}
          }
          return res;
        }
        if (access.tokenToSet) accessTokenToSet = access.tokenToSet;
      }
    } catch {}
    // Compute a weak ETag based solely on the lesson body
    const etag = (() => {
      try {
        const h = crypto.createHash('sha1');
        h.update(String(body || ""));
        return 'W/"' + h.digest('hex') + '"';
      } catch { return null; }
    })();
    const ifNone = req.headers.get('if-none-match');
    if (etag && ifNone && ifNone === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } });
    }

    // Return the raw HTML body without glossary highlighting
    const html = String(body || "");
    const res = NextResponse.json({ html });
    res.headers.set("Cache-Control", "public, max-age=60, s-maxage=86400, stale-while-revalidate=604800");
    if (etag) res.headers.set("ETag", etag);
    if (accessTokenToSet) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      res.cookies.set(courseTokenName(Number((row as any)?.courseId || 0)), accessTokenToSet.value, entitlementCookieOptions(accessTokenToSet.expiresAt, nowSeconds));
    }
    return res;
  } catch (e: any) {
    return NextResponse.json({ html: "" }, { status: 200 });
  }
}

