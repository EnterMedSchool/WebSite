import { NextResponse } from "next/server";
import { authGetServerSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { courses, imatUserPlan, lessons, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { detectProviderFromSrc, extractIframeSrc, firstYouTubeFromBody, isPremiumSrc } from "@/lib/video/embed";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const url = new URL(req.url);
  const slug = params.slug;
  const demo = url.searchParams.get("demo") === "1";

  // Auth (lightweight)
  const session = await authGetServerSession().catch(() => null);
  const userId = Number((session as any)?.userId || 0) || null;

  // 1) Load minimal lesson info (avoid large columns)
  const l = (await db
    .select({ id: lessons.id, courseId: lessons.courseId, videoHtml: lessons.videoHtml })
    .from(lessons)
    .where(eq(lessons.slug as any, slug))
    .limit(1))[0];
  if (!l) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // 2) Determine embed src from video_html if present; else attempt from body lazily
  let iframeSrc: string | null = extractIframeSrc(l.videoHtml as any);
  let source: "video_html" | "body" | "none" = iframeSrc ? "video_html" : "none";
  if (!iframeSrc) {
    const bodyRow = (await db
      .select({ body: lessons.body })
      .from(lessons)
      .where(eq(lessons.id as any, l.id))
      .limit(1))[0];
    const yt = firstYouTubeFromBody(bodyRow?.body || null);
    if (yt) {
      iframeSrc = yt;
      source = "body";
    }
  }

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
    if (userId) {
      const u = (await db
        .select({ isPremium: users.isPremium })
        .from(users)
        .where(eq(users.id as any, userId))
        .limit(1))[0];
      const hasPremium = !!u?.isPremium;
      const needsImat = /imat/.test(courseSlug);
      let hasImat = false;
      if (needsImat) {
        hasImat = !!(await db
          .select({ id: imatUserPlan.id })
          .from(imatUserPlan)
          .where(eq(imatUserPlan.userId as any, userId))
          .limit(1))[0];
      }
      entitled = needsImat ? hasImat || hasPremium : hasPremium || hasImat;
    }

    if (!entitled) {
      locked = true;
      lockReason = "Login and enroll to watch this video";
    }
  }

  // 4) For now we do not sign tokens; rely on Bunny allowed domains.
  // Later we can replace `iframeSrc` with a signed URL here when the key is available.

  // Prevent accidental leakage: if premium and locked, do not send the iframe src to the client
  if (locked && isPremiumSrc(iframeSrc)) {
    iframeSrc = null;
  }

  const res = NextResponse.json({ provider, iframeSrc, locked, lockReason, source });
  // Short cache to reduce DB hits while developing
  res.headers.set("Cache-Control", userId ? "private, max-age=30" : "public, max-age=60");
  return res;
}

