import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessons } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { highlightHTML } from "@/lib/glossary/ssr";
import { etagForBody } from "@/lib/glossary/ssr";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const req = _req; // for headers
    const slug = String(params.slug || "");
    if (!slug) return NextResponse.json({ html: "" });
    const row = (await db
      .select({ body: lessons.body })
      .from(lessons)
      .where(eq(lessons.slug as any, slug))
      .limit(1))[0];
    const body = String((row as any)?.body || "");
    if (!body) return NextResponse.json({ html: "" });
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
