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
  // Compute prev/next based on rank_key within the same course
  const lr2 = await sql`SELECT id, slug, title, COALESCE(rank_key,'') as rk FROM lessons WHERE course_id=${lesson.course_id} ORDER BY COALESCE(rank_key,'') ASC, slug ASC`;
  const ordered = lr2.rows as any[];
  const idx = ordered.findIndex((l:any)=> Number(l.id) === Number(lesson.id));
  const prev = idx>0 ? { slug: ordered[idx-1].slug, title: ordered[idx-1].title } : null;
  const next = idx>=0 && idx < ordered.length-1 ? { slug: ordered[idx+1].slug, title: ordered[idx+1].title } : null;
  return NextResponse.json({ lesson: { id: lesson.id, slug: lesson.slug, title: lesson.title }, course: cr.rows[0], blocks: br.rows, nav: { prev, next } });
}
