import { NextResponse } from "next/server";
import { resolveUserIdFromSession } from "@/lib/user";
import { getCourseTimeline } from "@/lib/courseTimeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || "4");
    const cursor = searchParams.get("cursor");
    const userId = await resolveUserIdFromSession();
    const data = await getCourseTimeline({ courseSlug: params.slug, userId, limit, cursor });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
}
