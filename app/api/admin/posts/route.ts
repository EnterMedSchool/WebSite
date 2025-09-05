export const runtime = "nodejs";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminSession } from "@/lib/authz";
import { db, sql } from "@/lib/db";
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

  try {
    const rows = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(100);
    return Response.json({ posts: rows });
  } catch (err: any) {
    return Response.json({ posts: [], warning: String(err?.message ?? err) });
  }
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

  // Ensure table exists; then insert with naive slug collision handling
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
    const msg = String(err?.message ?? err);
    if (msg.includes("relation \"posts\" does not exist") || msg.includes("42P01")) {
      // Create table on first write if missing
      await sql`CREATE TABLE IF NOT EXISTS posts (
        id serial PRIMARY KEY,
        slug varchar(160) NOT NULL UNIQUE,
        title varchar(200) NOT NULL,
        body text NOT NULL,
        published boolean NOT NULL DEFAULT false,
        cover_image_url varchar(500),
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );`;
      await sql`CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts (slug);`;
      // retry insert
      await db.insert(posts).values({
        slug: finalSlug,
        title: data.title,
        body: data.body,
        published: Boolean(data.published ?? false),
        coverImageUrl: data.coverImageUrl ?? null,
        updatedAt: new Date(),
      });
    } else if (msg.includes("duplicate key value") || msg.includes("unique")) {
      finalSlug = `${baseSlug}-${Date.now()}`;
      await db.insert(posts).values({
        slug: finalSlug,
        title: data.title,
        body: data.body,
        published: Boolean(data.published ?? false),
        coverImageUrl: data.coverImageUrl ?? null,
        updatedAt: new Date(),
      });
    } else {
      return Response.json({ error: msg }, { status: 500 });
    }
  }

  return Response.json({ ok: true, slug: finalSlug }, { status: 201 });
}
