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
