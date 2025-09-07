import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const slug = params.slug;
  const lr = await sql`SELECT id, slug, title, course_id FROM lessons WHERE slug=${slug} LIMIT 1`;
  const lesson = lr.rows[0];
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const br = await sql`SELECT id, kind, content FROM lesson_blocks WHERE lesson_id=${lesson.id} ORDER BY COALESCE(rank_key,'')`;
  const cr = await sql`SELECT id, slug, title FROM courses WHERE id=${lesson.course_id} LIMIT 1`;
  return NextResponse.json({ lesson: { id: lesson.id, slug: lesson.slug, title: lesson.title }, course: cr.rows[0], blocks: br.rows });
}
