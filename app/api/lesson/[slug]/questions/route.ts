import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkCourseAccess } from "@/lib/lesson/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const lr = await sql`SELECT id, course_id FROM lessons WHERE slug=${params.slug} LIMIT 1`;
  const lesson = lr.rows[0];
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Resolve auth and premium
  let userId = 0;
  let isPremium = false;
  try {
    const session = await getServerSession(authOptions as any);
    if (session) {
      userId = Number((session as any).userId || 0);
      if (!Number.isSafeInteger(userId) || userId <= 0 || userId > 2147483647) userId = 0;
      if (!userId && (session as any)?.user?.email) {
        const email = String((session as any).user.email).toLowerCase();
        const ur = await sql`SELECT id, is_premium FROM users WHERE email=${email} LIMIT 1`;
        if (ur.rows[0]?.id) {
          userId = Number(ur.rows[0].id);
          isPremium = !!ur.rows[0].is_premium;
        }
      } else if (userId) {
        const ur = await sql`SELECT is_premium FROM users WHERE id=${userId} LIMIT 1`;
        isPremium = !!ur.rows[0]?.is_premium;
      }
    }
  } catch {}

  // Paid course gating: if course is paid and user lacks entitlement, deny.
  try {
    const access = await checkCourseAccess(userId || 0, Number(lesson.course_id));
    if (access.accessType === 'paid' && !access.allowed) {
      return NextResponse.json({ error: 'forbidden', reason: 'paid_course' }, { status: 403 });
    }
  } catch {}

  // Access filter: logged-in users can see public/auth/premium; guests see public/guest (only after gating above)
  const qr = userId
    ? await sql`SELECT id, prompt, explanation, access FROM questions WHERE lesson_id=${lesson.id} AND (access IS NULL OR access IN ('public','auth','premium')) ORDER BY COALESCE(rank_key,'')`
    : await sql`SELECT id, prompt, explanation, access FROM questions WHERE lesson_id=${lesson.id} AND (access IS NULL OR access IN ('public','guest')) ORDER BY COALESCE(rank_key,'')`;
  const result: any[] = [];
  for (const q of qr.rows) {
    const cr = await sql`SELECT id, content, correct FROM choices WHERE question_id=${q.id}`;
    let answeredCorrect = false;
    let selectedChoiceId: number | null = null;
    if (userId) {
      const ar = await sql`SELECT choice_id, correct FROM user_question_progress WHERE user_id=${userId} AND question_id=${q.id} LIMIT 1`;
      answeredCorrect = !!ar.rows[0]?.correct;
      if (ar.rows[0]?.choice_id != null) selectedChoiceId = Number(ar.rows[0].choice_id);
    }
    result.push({ id: q.id, prompt: q.prompt, explanation: q.explanation, access: q.access || 'public', answeredCorrect, selectedChoiceId, choices: cr.rows.map((c:any)=>({ id:c.id, text:c.content, correct:c.correct })) });
  }
  return NextResponse.json({ questions: result });
}
