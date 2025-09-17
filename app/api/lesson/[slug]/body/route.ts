
import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/study/auth";
import { checkCourseAccess, entitlementCookieOptions } from "@/lib/lesson/access";
import { courseTokenName } from "@/lib/lesson/entitlements";
import { getLessonBundle } from "@/lib/lesson/bundles";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = String(params.slug || "");
    if (!slug) return NextResponse.json({ html: "" });

    const stored = await getLessonBundle(slug);
    if (!stored) return NextResponse.json({ html: "" });

    const html = String(stored.bundle.html || "");
    if (!html) return NextResponse.json({ html: "" });

    let tokenToSet: { value: string; expiresAt: number } | null = null;

    try {
      const userId = await requireUserId(req);
      const access = await checkCourseAccess(userId || 0, stored.courseId, { req });
      if (access.accessType === "paid" && !access.allowed) {
        const res = NextResponse.json({ error: "forbidden", reason: "paid_course" }, { status: 403 });
        res.cookies.set(`ems_paid_denied_${stored.courseId}`, String(Date.now()), { maxAge: 600, path: "/" });
        try { res.cookies.set(`ems_paid_denied_l_${slug}`, "1", { maxAge: 600, path: "/" }); } catch {}
        if (access.clearToken) {
          try { res.cookies.set(courseTokenName(stored.courseId), "", { maxAge: 0, path: "/" }); } catch {}
        }
        return res;
      }
      if (access.tokenToSet) tokenToSet = access.tokenToSet;
    } catch {}

    const etag = (() => {
      try {
        const h = crypto.createHash("sha1");
        h.update(String(stored.bundle.lesson.contentRev || 0));
        h.update("|");
        h.update(html);
        return 'W/"' + h.digest("hex") + '"';
      } catch {
        return null;
      }
    })();

    const ifNone = req.headers.get("if-none-match");
    if (etag && ifNone && ifNone === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } });
    }

    const res = NextResponse.json({ html });
    res.headers.set("Cache-Control", "public, max-age=60, s-maxage=86400, stale-while-revalidate=604800");
    if (etag) res.headers.set("ETag", etag);

    if (tokenToSet) {
      if (tokenToSet.value) {
        const nowSeconds = Math.floor(Date.now() / 1000);
        res.cookies.set(
          courseTokenName(stored.courseId),
          tokenToSet.value,
          entitlementCookieOptions(tokenToSet.expiresAt, nowSeconds)
        );
      } else {
        res.cookies.set(courseTokenName(stored.courseId), "", { maxAge: 0, path: "/" });
      }
    }

    return res;
  } catch (e: any) {
    return NextResponse.json({ html: "" }, { status: 200 });
  }
}
