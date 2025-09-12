import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessons } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { highlightHTML } from "@/lib/glossary/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = String(params.slug || "");
    if (!slug) return NextResponse.json({ html: "" });
    const row = (await db
      .select({ body: lessons.body })
      .from(lessons)
      .where(eq(lessons.slug as any, slug))
      .limit(1))[0];
    const body = String((row as any)?.body || "");
    if (!body) return NextResponse.json({ html: "" });

    const html = await highlightHTML(body);
    const res = NextResponse.json({ html });
    res.headers.set("Cache-Control", "public, max-age=60, s-maxage=86400, stale-while-revalidate=604800");
    return res;
  } catch (e: any) {
    return NextResponse.json({ html: "" }, { status: 200 });
  }
}

