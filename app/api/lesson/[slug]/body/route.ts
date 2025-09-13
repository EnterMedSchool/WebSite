import { NextResponse } from "next/server";
import { db, sql } from "@/lib/db";
import { lessons } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { highlightHTML } from "@/lib/glossary/ssr";
import { etagForBody } from "@/lib/glossary/ssr";
import fs from "node:fs/promises";
import path from "node:path";
import { requireUserId } from "@/lib/study/auth";
import { checkCourseAccess } from "@/lib/lesson/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
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

    // Paid course gating: if course is paid and user lacks entitlement, deny and throttle with cookie
    try {
      const courseId = Number((row as any)?.courseId || 0);
      if (courseId) {
        const userId = await requireUserId(_req);
        const access = await checkCourseAccess(userId || 0, courseId);
        if (access.accessType === 'paid' && !access.allowed) {
          const res = NextResponse.json({ error: 'forbidden', reason: 'paid_course' }, { status: 403 });
          res.cookies.set(`ems_paid_denied_${courseId}`, String(Date.now()), { maxAge: 600, path: '/' });
          try { res.cookies.set(`ems_paid_denied_l_${slug}`, '1', { maxAge: 600, path: '/' }); } catch {}
          return res;
        }
      }
    } catch {}
    // Pre-check ETag to serve 304 quickly
    const manifestPath = path.join(process.cwd(), 'public', 'glossary', 'index.v1.meta.json');
    let manifest: any = null;
    try { manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')); } catch {}
    const etag = etagForBody(body, manifest);
    const ifNone = _req.headers.get('if-none-match');
    if (etag && ifNone && ifNone === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } });
    }

    const html = await highlightHTML(body);
    const res = NextResponse.json({ html });
    res.headers.set("Cache-Control", "public, max-age=60, s-maxage=86400, stale-while-revalidate=604800");
    if (etag) res.headers.set("ETag", etag);
    return res;
  } catch (e: any) {
    return NextResponse.json({ html: "" }, { status: 200 });
  }
}
