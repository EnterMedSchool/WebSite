
import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/study/auth";
import { checkCourseAccess, entitlementCookieOptions } from "@/lib/lesson/access";
import { courseTokenName } from "@/lib/lesson/entitlements";
import { getLessonBundle } from "@/lib/lesson/bundles";
import { isPremiumSrc } from "@/lib/video/embed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const url = new URL(req.url);
    const slug = params.slug;
    const demo = url.searchParams.get("demo") === "1";
    const userId = (await requireUserId(req)) || 0;

    const stored = await getLessonBundle(slug);
    if (!stored) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const basePlayer = stored.bundle.player;
    const provider = basePlayer?.provider ?? null;
    let iframeSrc: string | null = basePlayer?.iframeSrc ?? null;
    const source = basePlayer?.source ?? "none";

    if (!iframeSrc) {
      const res = NextResponse.json({ provider, iframeSrc: null, locked: false, source });
      res.headers.set("Cache-Control", userId ? "private, max-age=30" : "public, max-age=60");
      return res;
    }

    let locked = false;
    let lockReason: string | undefined;
    let tokenToSet: { value: string; expiresAt: number } | null = null;

    if (!demo) {
      const access = await checkCourseAccess(userId || 0, stored.courseId, { req });
      if (access.accessType === "paid" && !access.allowed) {
        locked = true;
        lockReason = "Paid course - access required";
        if (access.clearToken) tokenToSet = { value: "", expiresAt: 0 };
      } else if (access.tokenToSet) {
        tokenToSet = access.tokenToSet;
      }
    }

    if (locked && iframeSrc && isPremiumSrc(iframeSrc)) {
      iframeSrc = null;
    }

    const res = NextResponse.json({ provider, iframeSrc, locked, lockReason, source });
    res.headers.set("Cache-Control", userId ? "private, max-age=30" : "public, max-age=60");

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

    if (locked && !demo) {
      try {
        res.cookies.set(`ems_paid_denied_${stored.courseId}`, String(Date.now()), { maxAge: 600, path: "/" });
        res.cookies.set(`ems_paid_denied_l_${slug}`, "1", { maxAge: 600, path: "/" });
      } catch {}
    }

    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}
