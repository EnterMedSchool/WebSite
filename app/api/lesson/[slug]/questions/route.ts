import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkCourseAccess, entitlementCookieOptions } from "@/lib/lesson/access";
import { courseTokenName } from "@/lib/lesson/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const lr = await sql`SELECT id, course_id FROM lessons WHERE slug=${params.slug} LIMIT 1`;
  const lesson = lr.rows[0];
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Resolve auth and premium
  let userId = 0;
  try {
    const session = await getServerSession(authOptions as any);
    if (session) {
      userId = Number((session as any).userId || 0);
      if (!Number.isSafeInteger(userId) || userId <= 0 || userId > 2147483647) userId = 0;
      if (!userId && (session as any)?.user?.email) {
        const email = String((session as any).user.email).toLowerCase();
        const ur = await sql`SELECT id FROM users WHERE email=${email} LIMIT 1`;
        if (ur.rows[0]?.id) {
          userId = Number(ur.rows[0].id);
        }
      }
    }
  } catch {}

  let tokenToSet: { value: string; expiresAt: number } | null = null;

  // Paid course gating: if course is paid and user lacks entitlement, deny.
  try {
    const access = await checkCourseAccess(userId || 0, Number(lesson.course_id), { req });
    if (access.accessType === "paid" && !access.allowed) {
      const res = NextResponse.json({ error: "forbidden", reason: "paid_course" }, { status: 403 });
      res.cookies.set(`ems_paid_denied_${Number(lesson.course_id)}`, String(Date.now()), { maxAge: 600, path: "/" });
      try { res.cookies.set(`ems_paid_denied_l_${params.slug}`, "1", { maxAge: 600, path: "/" }); } catch {}
      if (access.clearToken) {
        try { res.cookies.set(courseTokenName(Number(lesson.course_id)), "", { maxAge: 0, path: "/" }); } catch {}
      }
      return res;
    }
    if (access.tokenToSet) tokenToSet = access.tokenToSet;
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
    result.push({ id: q.id, prompt: q.prompt, explanation: q.explanation, access: q.access || "public", answeredCorrect, selectedChoiceId, choices: cr.rows.map((c: any) => ({ id: c.id, text: c.content, correct: c.correct })) });
  }
  const res = NextResponse.json({ questions: result });
  if (tokenToSet) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    res.cookies.set(courseTokenName(Number(lesson.course_id)), tokenToSet.value, entitlementCookieOptions(tokenToSet.expiresAt, nowSeconds));
  }
  return res;
}
