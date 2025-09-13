import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessons } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { detectProviderFromSrc, extractIframeSrc, isPremiumSrc } from "@/lib/video/embed";
import { requireUserId } from "@/lib/study/auth";
import { checkCourseAccess } from "@/lib/lesson/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const url = new URL(req.url);
    const slug = params.slug;
    const demo = url.searchParams.get("demo") === "1";
    const userId = (await requireUserId(req)) || 0;

    // 1) Load minimal lesson info (avoid large columns)
    const l = (await db
      .select({ id: lessons.id, courseId: lessons.courseId, videoHtml: lessons.videoHtml })
      .from(lessons)
      .where(eq(lessons.slug as any, slug))
      .limit(1))[0];
    if (!l) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // 2) Determine embed src only from video_html (always prefer it; ignore body)
    let iframeSrc: string | null = extractIframeSrc((l as any).videoHtml);
    let source: "video_html" | "none" = iframeSrc ? "video_html" : "none";
    if (!iframeSrc) {
      const res = NextResponse.json({ provider: null, iframeSrc: null, locked: false, source });
      res.headers.set("Cache-Control", "public, max-age=60");
      return res;
    }

    // 3) Determine provider and entitlement
    const provider = detectProviderFromSrc(iframeSrc);
    let locked = false;
    let lockReason: string | undefined;

    if (!demo) {
      const access = await checkCourseAccess(userId || 0, Number((l as any).courseId));
      if (access.accessType === 'paid' && !access.allowed) {
        locked = true;
        lockReason = 'Paid course — access required';
      }
    }

    // Prevent accidental leakage: if premium and locked, do not send the iframe src to the client
    if (locked && isPremiumSrc(iframeSrc)) {
      iframeSrc = null;
    }

    const res = NextResponse.json({ provider, iframeSrc, locked, lockReason, source });
    // Short cache to reduce DB hits while developing
    res.headers.set("Cache-Control", userId ? "private, max-age=30" : "public, max-age=60");
    if (locked) {
      try {
        res.cookies.set(`ems_paid_denied_${Number((l as any).courseId)}`, String(Date.now()), { maxAge: 600, path: '/' });
        res.cookies.set(`ems_paid_denied_l_${slug}`, '1', { maxAge: 600, path: '/' });
      } catch {}
    }
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}
