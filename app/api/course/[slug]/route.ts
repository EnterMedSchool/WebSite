import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  const cr = await sql`SELECT id, slug, title, description FROM courses WHERE slug=${slug} LIMIT 1`;
  const course = cr.rows[0];
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const lr = await sql`SELECT id, slug, title FROM lessons WHERE course_id=${course.id}`;
  return NextResponse.json({ course, lessons: lr.rows });
}
