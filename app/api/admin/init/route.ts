export const runtime = "nodejs";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminSession } from "@/lib/authz";
import { sql } from "@/lib/db";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Minimal init to ensure posts table exists
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

  return Response.json({ ok: true });
}

