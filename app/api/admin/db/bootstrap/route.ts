export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql as dsql } from "drizzle-orm";

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

const BOOTSTRAP_SQL = `
-- Inline bootstrap of schema (safe to re-run)
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "username" varchar(80) NOT NULL UNIQUE,
  "name" varchar(120),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "courses" (
  "id" serial PRIMARY KEY,
  "slug" varchar(120) NOT NULL UNIQUE,
  "title" varchar(200) NOT NULL,
  "description" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "courses_slug_idx" ON "courses" ("slug");

CREATE TABLE IF NOT EXISTS "lessons" (
  "id" serial PRIMARY KEY,
  "course_id" integer NOT NULL,
  "slug" varchar(120) NOT NULL,
  "title" varchar(200) NOT NULL,
  "body" text,
  "position" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "lessons_course_idx" ON "lessons" ("course_id");

CREATE TABLE IF NOT EXISTS "questions" (
  "id" serial PRIMARY KEY,
  "lesson_id" integer NOT NULL,
  "prompt" text NOT NULL,
  "explanation" text
);
CREATE INDEX IF NOT EXISTS "questions_lesson_idx" ON "questions" ("lesson_id");

CREATE TABLE IF NOT EXISTS "choices" (
  "id" serial PRIMARY KEY,
  "question_id" integer NOT NULL,
  "content" text NOT NULL,
  "correct" boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS "choices_question_idx" ON "choices" ("question_id");

CREATE TABLE IF NOT EXISTS "quiz_attempts" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "lesson_id" integer NOT NULL,
  "started_at" timestamp NOT NULL DEFAULT now(),
  "finished_at" timestamp,
  "score" integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "attempts_user_idx" ON "quiz_attempts" ("user_id");
CREATE INDEX IF NOT EXISTS "attempts_lesson_idx" ON "quiz_attempts" ("lesson_id");

CREATE TABLE IF NOT EXISTS "attempt_answers" (
  "id" serial PRIMARY KEY,
  "attempt_id" integer NOT NULL,
  "question_id" integer NOT NULL,
  "choice_id" integer NOT NULL,
  "correct" boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS "answers_attempt_idx" ON "attempt_answers" ("attempt_id");
CREATE INDEX IF NOT EXISTS "answers_question_idx" ON "attempt_answers" ("question_id");

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL,
  "type" varchar(50) NOT NULL,
  "data" jsonb,
  "read" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" ("user_id");

CREATE TABLE IF NOT EXISTS "rooms" (
  "id" serial PRIMARY KEY,
  "name" varchar(120) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id" serial PRIMARY KEY,
  "room_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "messages_room_idx" ON "messages" ("room_id");
CREATE INDEX IF NOT EXISTS "messages_user_idx" ON "messages" ("user_id");

CREATE TABLE IF NOT EXISTS "posts" (
  "id" serial PRIMARY KEY,
  "slug" varchar(160) NOT NULL UNIQUE,
  "title" varchar(200) NOT NULL,
  "body" text NOT NULL,
  "published" boolean NOT NULL DEFAULT false,
  "cover_image_url" varchar(500),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "posts_slug_idx" ON "posts" ("slug");

CREATE TABLE IF NOT EXISTS "countries" (
  "id" serial PRIMARY KEY,
  "name" varchar(120) NOT NULL UNIQUE,
  "iso_a3" varchar(3),
  "center_lat" double precision,
  "center_lng" double precision,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "countries_name_idx" ON "countries" ("name");

CREATE TABLE IF NOT EXISTS "universities" (
  "id" serial PRIMARY KEY,
  "country_id" integer NOT NULL,
  "city" varchar(120) NOT NULL,
  "name" varchar(200) NOT NULL,
  "lat" double precision NOT NULL,
  "lng" double precision NOT NULL,
  "kind" varchar(10),
  "logo_url" varchar(500),
  "rating" double precision,
  "last_score" integer,
  "photos" jsonb,
  "orgs" jsonb,
  "article" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "universities_country_idx" ON "universities" ("country_id");
CREATE INDEX IF NOT EXISTS "universities_city_idx" ON "universities" ("city");

CREATE TABLE IF NOT EXISTS "university_scores" (
  "id" serial PRIMARY KEY,
  "university_id" integer NOT NULL,
  "year" integer NOT NULL,
  "candidate_type" varchar(24) NOT NULL,
  "min_score" double precision NOT NULL
);
CREATE INDEX IF NOT EXISTS "scores_university_idx" ON "university_scores" ("university_id");
CREATE INDEX IF NOT EXISTS "scores_year_idx" ON "university_scores" ("year");

CREATE TABLE IF NOT EXISTS "university_seats" (
  "id" serial PRIMARY KEY,
  "university_id" integer NOT NULL,
  "year" integer NOT NULL,
  "candidate_type" varchar(24) NOT NULL,
  "seats" integer NOT NULL
);
CREATE INDEX IF NOT EXISTS "seats_university_idx" ON "university_seats" ("university_id");
CREATE INDEX IF NOT EXISTS "seats_year_idx" ON "university_seats" ("year");

CREATE TABLE IF NOT EXISTS "university_testimonials" (
  "id" serial PRIMARY KEY,
  "university_id" integer NOT NULL,
  "author" varchar(120) NOT NULL,
  "quote" text NOT NULL,
  "rating" double precision,
  "categories" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "testimonials_university_idx" ON "university_testimonials" ("university_id");

CREATE TABLE IF NOT EXISTS "university_media" (
  "id" serial PRIMARY KEY,
  "university_id" integer NOT NULL,
  "type" varchar(20) NOT NULL,
  "url" varchar(500) NOT NULL,
  "title" varchar(200),
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "media_university_idx" ON "university_media" ("university_id");

CREATE TABLE IF NOT EXISTS "university_articles" (
  "id" serial PRIMARY KEY,
  "university_id" integer NOT NULL,
  "title" varchar(200) NOT NULL,
  "href" varchar(500) NOT NULL,
  "published_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "articles_university_idx" ON "university_articles" ("university_id");

CREATE TABLE IF NOT EXISTS "university_pages" (
  "id" serial PRIMARY KEY,
  "university_id" integer NOT NULL,
  "locale" varchar(10) NOT NULL DEFAULT 'en',
  "content_html" text NOT NULL,
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "university_pages_uni_locale_idx" ON "university_pages" ("university_id");
`;

export async function GET(request: Request) {
  const forbidden = requireKey(request);
  if (forbidden) return forbidden;

  try {
    const parts = BOOTSTRAP_SQL
      .split(/;\s*\n/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of parts) {
      await db.execute(dsql.raw(stmt));
    }
    return NextResponse.json({ ok: true, statements: parts.length });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
