import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const lr = await sql`SELECT id FROM lessons WHERE slug=${params.slug} LIMIT 1`;
  const lesson = lr.rows[0];
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const qr = await sql`SELECT id, prompt, explanation FROM questions WHERE lesson_id=${lesson.id} ORDER BY COALESCE(rank_key,'')`;
  const result: any[] = [];
  for (const q of qr.rows) {
    const cr = await sql`SELECT id, content, correct FROM choices WHERE question_id=${q.id}`;
    result.push({ id: q.id, prompt: q.prompt, explanation: q.explanation, choices: cr.rows.map((c:any)=>({ id:c.id, text:c.content, correct:c.correct })) });
  }
  return NextResponse.json({ questions: result });
}
