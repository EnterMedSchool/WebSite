export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({ id: posts.id, slug: posts.slug, title: posts.title, createdAt: posts.createdAt })
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(50);

    return Response.json({ posts: rows });
  } catch (err) {
    // Graceful fallback if table is not created yet
    return Response.json({ posts: [] });
  }
}
