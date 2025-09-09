export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

function requireKey(request: Request) {
  const url = new URL(request.url);
  const qp = url.searchParams.get("key");
  const headerKey = request.headers.get("x-seed-key");
  const key = (qp ?? headerKey ?? "").trim().replace(/^['"]|['"]$/g, "");
  const secret = (process.env.SEED_SECRET ?? "").trim().replace(/^['"]|['"]$/g, "");
  if (!secret || !key || key !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

type CourseSpec = {
  slug: string;
  title: string;
  description?: string;
  chapters: {
    slug: string;
    title: string;
    lessons: { slug: string; title: string; length: number; body?: string }[];
  }[];
};

async function ensureCourse(slug: string, title: string, description?: string) {
  const r = await sql`
    INSERT INTO courses (slug, title, description, visibility)
    VALUES (${slug}, ${title}, ${description ?? null}, 'public')
    ON CONFLICT (slug)
    DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description
    RETURNING id`;
  return Number(r.rows[0].id);
}

async function ensureChapter(courseId: number, slug: string, title: string, position: number) {
  const r = await sql`
    INSERT INTO chapters (course_id, slug, title, position, visibility)
    VALUES (${courseId}, ${slug}, ${title}, ${position}, 'public')
    ON CONFLICT (slug)
    DO UPDATE SET course_id = EXCLUDED.course_id, title = EXCLUDED.title, position = EXCLUDED.position
    RETURNING id`;
  return Number(r.rows[0].id);
}

async function ensureLesson(courseId: number, slug: string, title: string, lengthMin: number, position: number, body?: string) {
  const existing = await sql`SELECT id FROM lessons WHERE course_id=${courseId} AND slug=${slug} LIMIT 1`;
  if (existing.rows[0]?.id) return Number(existing.rows[0].id);
  const r = await sql`
    INSERT INTO lessons (course_id, slug, title, body, position, visibility, length_min)
    VALUES (${courseId}, ${slug}, ${title}, ${body ?? ''}, ${position}, 'public', ${lengthMin})
    RETURNING id`;
  return Number(r.rows[0].id);
}

async function linkLessonToChapter(chapterId: number, lessonId: number, position: number) {
  await sql`
    INSERT INTO chapter_lessons (chapter_id, lesson_id, position)
    VALUES (${chapterId}, ${lessonId}, ${position})
    ON CONFLICT (chapter_id, lesson_id) DO NOTHING`;
}

async function ensureQuestion(lessonId: number, prompt: string, explanation: string, choices: { content: string; correct?: boolean }[]) {
  const qx = await sql`SELECT id FROM questions WHERE lesson_id=${lessonId} AND prompt=${prompt} LIMIT 1`;
  let qid: number;
  if (qx.rows[0]?.id) qid = Number(qx.rows[0].id);
  else {
    const qr = await sql`
      INSERT INTO questions (lesson_id, prompt, explanation, access, difficulty)
      VALUES (${lessonId}, ${prompt}, ${explanation}, 'public', 'easy')
      RETURNING id`;
    qid = Number(qr.rows[0].id);
  }
  for (const ch of choices) {
    const cx = await sql`SELECT id FROM choices WHERE question_id=${qid} AND content=${ch.content} LIMIT 1`;
    if (!cx.rows[0]?.id) {
      await sql`INSERT INTO choices (question_id, content, correct) VALUES (${qid}, ${ch.content}, ${!!ch.correct})`;
    }
  }
}

const DATA: CourseSpec[] = [
  {
    slug: 'microbiology',
    title: 'Microbiology',
    description: 'Bacteria, viruses, fungi: essentials for entrance exams.',
    chapters: [
      { slug: 'micro-intro', title: 'Microbiology Basics', lessons: [
        { slug: 'bacteria-overview', title: 'Bacteria Overview', length: 25, body: 'Demo: What are bacteria and how do they grow?' },
        { slug: 'viruses-101', title: 'Viruses 101', length: 20, body: 'Demo: Viruses replicate inside host cells.' },
        { slug: 'fungi-facts', title: 'Fungi Facts', length: 18, body: 'Demo: Fungi include yeasts and molds.' },
      ]},
      { slug: 'micro-immunity', title: 'Host Defense', lessons: [
        { slug: 'innate-immunity', title: 'Innate Immunity', length: 22, body: 'Demo: First line defenses and phagocytes.' },
        { slug: 'adaptive-immunity', title: 'Adaptive Immunity', length: 24, body: 'Demo: B and T cells coordinate responses.' },
      ]}
    ]
  },
  {
    slug: 'biochemistry',
    title: 'Biochemistry',
    description: 'Macromolecules, metabolism, and enzymes.',
    chapters: [
      { slug: 'bio-enzymes', title: 'Enzymes', lessons: [
        { slug: 'enzyme-basics', title: 'Enzyme Basics', length: 20, body: 'Demo: Enzymes lower activation energy.' },
        { slug: 'enzyme-kinetics', title: 'Enzyme Kinetics', length: 26, body: 'Demo: Michaelis–Menten and Vmax.' },
      ]},
      { slug: 'bio-macros', title: 'Macromolecules', lessons: [
        { slug: 'proteins', title: 'Proteins', length: 22, body: 'Demo: Amino acids and protein folding.' },
        { slug: 'carbohydrates', title: 'Carbohydrates', length: 18, body: 'Demo: Monosaccharides to polysaccharides.' },
      ]}
    ]
  },
  {
    slug: 'anatomy',
    title: 'Anatomy',
    description: 'Structures and systems of the human body.',
    chapters: [
      { slug: 'anat-skeletal', title: 'Skeletal System', lessons: [
        { slug: 'bone-basics', title: 'Bone Basics', length: 21, body: 'Demo: Bone is living tissue supporting the body.' },
        { slug: 'joints', title: 'Joints', length: 19, body: 'Demo: Synovial joints allow movement.' },
      ]},
      { slug: 'anat-cardiac', title: 'Cardiovascular', lessons: [
        { slug: 'heart-anatomy', title: 'Heart Anatomy', length: 24, body: 'Demo: Chambers, valves, and conduction system.' },
      ]}
    ]
  }
];

export async function GET(request: Request) { return POST(request); }

export async function POST(request: Request) {
  const forbidden = requireKey(request);
  if (forbidden) return forbidden;
  try {
    let courseCount = 0, chapterCount = 0, lessonCount = 0, questionCount = 0, choiceCount = 0;
    for (const c of DATA) {
      const courseId = await ensureCourse(c.slug, c.title, c.description);
      courseCount++;
      let chPos = 1;
      for (const ch of c.chapters) {
        const chapterId = await ensureChapter(courseId, ch.slug, ch.title, chPos++);
        chapterCount++;
        let lpos = 1;
        for (const l of ch.lessons) {
          const lessonId = await ensureLesson(courseId, l.slug, l.title, l.length, lpos++, l.body);
          await linkLessonToChapter(chapterId, lessonId, lpos);
          lessonCount++;

          // Two demo questions per lesson
          await ensureQuestion(lessonId, `Demo Q1: ${l.title}?`, `Short explanation for ${l.title}.`, [
            { content: `Correct fact about ${l.title}`, correct: true },
            { content: `Incorrect fact A` },
            { content: `Incorrect fact B` },
            { content: `Incorrect fact C` },
          ]);
          await ensureQuestion(lessonId, `Demo Q2: Identify the right statement about ${l.slug}.`, `Another brief explanation.`, [
            { content: `Option 1` },
            { content: `Option 2 (correct)`, correct: true },
            { content: `Option 3` },
            { content: `Option 4` },
          ]);
          questionCount += 2; choiceCount += 8;
        }
      }
    }
    return NextResponse.json({ ok: true, courses: courseCount, chapters: chapterCount, lessons: lessonCount, questions: questionCount, choices: choiceCount });
  } catch (e: any) {
    return NextResponse.json({ error: 'internal_error', message: String(e?.message || e) }, { status: 500 });
  }
}

