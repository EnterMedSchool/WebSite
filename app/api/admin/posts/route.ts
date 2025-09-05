export const runtime = "nodejs";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminSession } from "@/lib/authz";
import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { desc } from "drizzle-orm";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 160);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(100);

  return Response.json({ posts: rows });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.json().catch(() => null);
  if (!data || !data.title || !data.body) {
    return Response.json({ error: "Missing title or body" }, { status: 400 });
  }

  const baseSlug = data.slug ? slugify(data.slug) : slugify(data.title);
  let finalSlug = baseSlug || `post-${Date.now()}`;

  // naive collision handling by appending timestamp
  try {
    await db.insert(posts).values({
      slug: finalSlug,
      title: data.title,
      body: data.body,
      published: Boolean(data.published ?? false),
      coverImageUrl: data.coverImageUrl ?? null,
      updatedAt: new Date(),
    });
  } catch (err: any) {
    finalSlug = `${baseSlug}-${Date.now()}`;
    await db.insert(posts).values({
      slug: finalSlug,
      title: data.title,
      body: data.body,
      published: Boolean(data.published ?? false),
      coverImageUrl: data.coverImageUrl ?? null,
      updatedAt: new Date(),
    });
  }

  return Response.json({ ok: true, slug: finalSlug }, { status: 201 });
}

