export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug;
    const rows = await db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, slug), eq(posts.published, true)))
      .limit(1);

    if (rows.length === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(rows[0]);
  } catch (err) {
    // If table is missing during first deploy, return 404
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}
