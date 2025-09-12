import { NextResponse } from "next/server";
import { authGetServerSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { courses, imatUserPlan, lessons, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { detectProviderFromSrc, extractIframeSrc, isPremiumSrc } from "@/lib/video/embed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const url = new URL(req.url);
    const slug = params.slug;
    const demo = url.searchParams.get("demo") === "1";

    // Auth (lightweight)
    const session = await authGetServerSession().catch(() => null);
    // Normalize and clamp userId to a safe 32-bit integer range. Fallback to 0/null if invalid.
    const rawUid = Number((session as any)?.userId || 0);
    const userId = Number.isInteger(rawUid) && rawUid > 0 && rawUid <= 2147483647 ? rawUid : 0;

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

    if (provider === "bunny" && !demo) {
      // Determine if this course is IMAT-specific for tiering
      const c = (await db
        .select({ slug: courses.slug })
        .from(courses)
        .where(eq(courses.id as any, l.courseId))
        .limit(1))[0];
      const courseSlug = (c?.slug || "").toLowerCase();

      // Entitlements: premium or IMAT plan
      let entitled = false;
      let hasPremium = false;
      let hasImat = false;
      let effectiveUserId = userId;

      // If numeric userId is invalid/out-of-range, try to resolve by email instead
      if (!effectiveUserId && (session as any)?.user?.email) {
        try {
          const email = String((session as any).user.email).toLowerCase();
          const u2 = (await db
            .select({ id: users.id, isPremium: users.isPremium })
            .from(users)
            .where(eq(users.email as any, email))
            .limit(1))[0];
          if (u2?.id) {
            effectiveUserId = Number(u2.id) || 0;
            hasPremium = !!u2.isPremium;
          }
        } catch {}
      }

      if (effectiveUserId) {
        if (!hasPremium) {
          const u = (await db
            .select({ isPremium: users.isPremium })
            .from(users)
            .where(eq(users.id as any, effectiveUserId))
            .limit(1))[0];
          hasPremium = !!u?.isPremium;
        }
        const needsImat = /imat/.test(courseSlug) || Number(l.courseId) === 10;
        if (needsImat) {
          hasImat = !!(await db
            .select({ id: imatUserPlan.id })
            .from(imatUserPlan)
            .where(eq(imatUserPlan.userId as any, effectiveUserId))
            .limit(1))[0];
        }
        entitled = needsImat ? hasImat || hasPremium : hasPremium || hasImat;
      }

      if (!entitled) {
        locked = true;
        lockReason = "Login and enroll to watch this video";
      }
    }

    // Prevent accidental leakage: if premium and locked, do not send the iframe src to the client
    if (locked && isPremiumSrc(iframeSrc)) {
      iframeSrc = null;
    }

    const res = NextResponse.json({ provider, iframeSrc, locked, lockReason, source });
    // Short cache to reduce DB hits while developing
    res.headers.set("Cache-Control", userId ? "private, max-age=30" : "public, max-age=60");
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}
