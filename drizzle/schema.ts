import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
  doublePrecision,
} from "drizzle-orm/pg-core";

// Core domain tables (minimal starting point)

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 120 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courses = pgTable(
  "courses",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ slugIdx: index("courses_slug_idx").on(t.slug) })
);

export const lessons = pgTable(
  "lessons",
  {
    id: serial("id").primaryKey(),
    courseId: integer("course_id").notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body"),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ courseIdx: index("lessons_course_idx").on(t.courseId) })
);

export const questions = pgTable(
  "questions",
  {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id").notNull(),
    prompt: text("prompt").notNull(),
    explanation: text("explanation"),
  },
  (t) => ({ lessonIdx: index("questions_lesson_idx").on(t.lessonId) })
);

export const choices = pgTable(
  "choices",
  {
    id: serial("id").primaryKey(),
    questionId: integer("question_id").notNull(),
    content: text("content").notNull(),
    correct: boolean("correct").default(false).notNull(),
  },
  (t) => ({ questionIdx: index("choices_question_idx").on(t.questionId) })
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    lessonId: integer("lesson_id").notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    finishedAt: timestamp("finished_at"),
    score: integer("score").default(0).notNull(),
  },
  (t) => ({
    userIdx: index("attempts_user_idx").on(t.userId),
    lessonIdx: index("attempts_lesson_idx").on(t.lessonId),
  })
);

export const attemptAnswers = pgTable(
  "attempt_answers",
  {
    id: serial("id").primaryKey(),
    attemptId: integer("attempt_id").notNull(),
    questionId: integer("question_id").notNull(),
    choiceId: integer("choice_id").notNull(),
    correct: boolean("correct").default(false).notNull(),
  },
  (t) => ({
    attemptIdx: index("answers_attempt_idx").on(t.attemptId),
    questionIdx: index("answers_question_idx").on(t.questionId),
  })
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    data: jsonb("data"),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ userIdx: index("notifications_user_idx").on(t.userId) })
);

export const rooms = pgTable(
  "rooms",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    roomId: integer("room_id").notNull(),
    userId: integer("user_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    roomIdx: index("messages_room_idx").on(t.roomId),
    userIdx: index("messages_user_idx").on(t.userId),
  })
);

// Blog posts
export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    published: boolean("published").default(false).notNull(),
    coverImageUrl: varchar("cover_image_url", { length: 500 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({ slugIdx: index("posts_slug_idx").on(t.slug) })
);

// University data (for map and elsewhere)
export const countries = pgTable(
  "countries",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull().unique(),
    isoA3: varchar("iso_a3", { length: 3 }),
    centerLat: doublePrecision("center_lat"),
    centerLng: doublePrecision("center_lng"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ nameIdx: index("countries_name_idx").on(t.name) })
);

export const universities = pgTable(
  "universities",
  {
    id: serial("id").primaryKey(),
    countryId: integer("country_id").notNull(),
    city: varchar("city", { length: 120 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    kind: varchar("kind", { length: 10 }), // public | private
    language: varchar("language", { length: 24 }), // course language (e.g., English, Italian)
    admissionExam: varchar("admission_exam", { length: 40 }), // e.g., IMAT, TOLC-MED, UCAT, etc.
    logoUrl: varchar("logo_url", { length: 500 }),
    rating: doublePrecision("rating"),
    lastScore: integer("last_score"),
    photos: jsonb("photos"), // string[]
    orgs: jsonb("orgs"), // string[]
    article: jsonb("article"), // { title, href? }
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    countryIdx: index("universities_country_idx").on(t.countryId),
    cityIdx: index("universities_city_idx").on(t.city),
  })
);

// Per-year minimum admission scores by candidate type
export const universityScores = pgTable(
  "university_scores",
  {
    id: serial("id").primaryKey(),
    universityId: integer("university_id").notNull(),
    year: integer("year").notNull(),
    candidateType: varchar("candidate_type", { length: 24 }).notNull(), // e.g., EU, NonEU, MarcoPolo
    minScore: doublePrecision("min_score").notNull(),
  },
  (t) => ({
    uniIdx: index("scores_university_idx").on(t.universityId),
    yearIdx: index("scores_year_idx").on(t.year),
  })
);

// Per-year seat counts by candidate type
export const universitySeats = pgTable(
  "university_seats",
  {
    id: serial("id").primaryKey(),
    universityId: integer("university_id").notNull(),
    year: integer("year").notNull(),
    candidateType: varchar("candidate_type", { length: 24 }).notNull(),
    seats: integer("seats").notNull(),
  },
  (t) => ({
    uniIdx: index("seats_university_idx").on(t.universityId),
    yearIdx: index("seats_year_idx").on(t.year),
  })
);

// Student testimonials / reviews
export const universityTestimonials = pgTable(
  "university_testimonials",
  {
    id: serial("id").primaryKey(),
    universityId: integer("university_id").notNull(),
    author: varchar("author", { length: 120 }).notNull(),
    quote: text("quote").notNull(),
    rating: doublePrecision("rating"),
    categories: jsonb("categories"), // { [category]: number }
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ uniIdx: index("testimonials_university_idx").on(t.universityId) })
);

// Latest media (images/videos) for a university
export const universityMedia = pgTable(
  "university_media",
  {
    id: serial("id").primaryKey(),
    universityId: integer("university_id").notNull(),
    type: varchar("type", { length: 20 }).notNull(), // image | video
    url: varchar("url", { length: 500 }).notNull(),
    title: varchar("title", { length: 200 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ uniIdx: index("media_university_idx").on(t.universityId) })
);

// Latest articles (simple links) related to a university
export const universityArticles = pgTable(
  "university_articles",
  {
    id: serial("id").primaryKey(),
    universityId: integer("university_id").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    href: varchar("href", { length: 500 }).notNull(),
    publishedAt: timestamp("published_at").defaultNow().notNull(),
  },
  (t) => ({ uniIdx: index("articles_university_idx").on(t.universityId) })
);

// Editable page content per university and locale
export const universityPages = pgTable(
  "university_pages",
  {
    id: serial("id").primaryKey(),
    universityId: integer("university_id").notNull(),
    locale: varchar("locale", { length: 10 }).notNull().default("en"),
    contentHtml: text("content_html").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    uniLocaleIdx: index("university_pages_uni_locale_idx").on(t.universityId),
  })
);

// Programs (per-university)
export const universityPrograms = pgTable(
  "university_programs",
  {
    id: serial("id").primaryKey(),
    universityId: integer("university_id").notNull(),
    name: varchar("name", { length: 120 }),
    language: varchar("language", { length: 24 }).notNull(),
    admissionExam: varchar("admission_exam", { length: 40 }),
    tuitionMin: integer("tuition_min"),
    tuitionMax: integer("tuition_max"),
    currency: varchar("currency", { length: 8 }),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ programUniIdx: index("programs_university_idx").on(t.universityId) })
);

export const programYearStats = pgTable(
  "program_year_stats",
  {
    id: serial("id").primaryKey(),
    programId: integer("program_id").notNull(),
    year: integer("year").notNull(),
    candidateType: varchar("candidate_type", { length: 24 }).notNull(),
    minScore: doublePrecision("min_score"),
    seats: integer("seats"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    programIdx: index("program_year_stats_program_idx").on(t.programId),
    yearIdx: index("program_year_stats_year_idx").on(t.year),
  })
);
