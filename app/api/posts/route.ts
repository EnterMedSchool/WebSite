export const runtime = "nodejs";

import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select({ id: posts.id, slug: posts.slug, title: posts.title, createdAt: posts.createdAt })
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(desc(posts.createdAt))
    .limit(50);

  return Response.json({ posts: rows });
}

