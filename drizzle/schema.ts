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
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Core domain tables (minimal starting point)

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 120 }),
  email: varchar("email", { length: 255 }),
  emailVerified: timestamp("email_verified"),
  image: varchar("image", { length: 500 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  xp: integer("xp").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  totalCorrectAnswers: integer("total_correct_answers").default(0).notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Course Mates profile fields
  universityId: integer("university_id"),
  schoolId: integer("school_id"),
  medicalCourseId: integer("medical_course_id"),
  studyYear: integer("study_year"),
  matesVerified: boolean("mates_verified").default(false).notNull(),
});

export const courses = pgTable(
  "courses",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    rankKey: varchar("rank_key", { length: 32 }),
    visibility: varchar("visibility", { length: 16 }).default("public"),
    meta: jsonb("meta"),
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
    // Optional thumbnail for homepage mini-lesson slider
    miniLessonThumbnail: varchar("mini_lesson_thumbnail", { length: 500 }),
    body: text("body"),
    position: integer("position").default(0).notNull(),
    rankKey: varchar("rank_key", { length: 32 }),
    visibility: varchar("visibility", { length: 16 }).default("public"),
    sectionId: integer("section_id"),
    durationMin: integer("duration_min"),
    // New explicit length in minutes for UI summaries
    // Kept separate to avoid breaking existing uses of durationMin
    lengthMin: integer("length_min"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ courseIdx: index("lessons_course_idx").on(t.courseId) })
);

// Chapters group lessons within a course. Lessons can appear in multiple
// chapters via the junction table below, and chapters have an explicit
// sequence (position) within a course.
export const chapters = pgTable(
  "chapters",
  {
    id: serial("id").primaryKey(),
    courseId: integer("course_id").notNull(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    position: integer("position").default(0).notNull(),
    visibility: varchar("visibility", { length: 16 }).default("public"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    courseIdx: index("chapters_course_idx").on(t.courseId),
    slugIdx: index("chapters_slug_idx").on(t.slug),
  })
);

// Many-to-many mapping: lessons within a chapter with explicit ordering.
export const chapterLessons = pgTable(
  "chapter_lessons",
  {
    id: serial("id").primaryKey(),
    chapterId: integer("chapter_id").notNull(),
    lessonId: integer("lesson_id").notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    chapterIdx: index("chapter_lessons_chapter_idx").on(t.chapterId),
    lessonIdx: index("chapter_lessons_lesson_idx").on(t.lessonId),
    orderIdx: index("chapter_lessons_order_idx").on(t.chapterId, t.position),
  })
);

export const questions = pgTable(
  "questions",
  {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id").notNull(),
    prompt: text("prompt").notNull(),
    explanation: text("explanation"),
    access: varchar("access", { length: 12 }), // public | auth | guest | premium
    rankKey: varchar("rank_key", { length: 32 }),
    difficulty: varchar("difficulty", { length: 10 }),
    tags: jsonb("tags"),
    version: integer("version").default(1),
    meta: jsonb("meta"),
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

// Persistent per-user per-question progress (one row per user x question)
export const userQuestionProgress = pgTable(
  "user_question_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    questionId: integer("question_id").notNull(),
    choiceId: integer("choice_id"),
    correct: boolean("correct").default(false).notNull(),
    answeredAt: timestamp("answered_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("uqp_user_idx").on(t.userId),
    questionIdx: index("uqp_question_idx").on(t.questionId),
  })
);

// New LMS tables
export const courseSections = pgTable(
  "course_sections",
  {
    id: serial("id").primaryKey(),
    courseId: integer("course_id").notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    rankKey: varchar("rank_key", { length: 32 }),
  },
  (t) => ({ courseIdx: index("course_sections_course_idx").on(t.courseId) })
);

export const lessonBlocks = pgTable(
  "lesson_blocks",
  {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id").notNull(),
    kind: varchar("kind", { length: 20 }).notNull(),
    content: text("content"),
    rankKey: varchar("rank_key", { length: 32 }),
  },
  (t) => ({ lessonIdx: index("lesson_blocks_lesson_idx").on(t.lessonId) })
);

export const lessonPrerequisites = pgTable(
  "lesson_prerequisites",
  {
    lessonId: integer("lesson_id").notNull(),
    requiresLessonId: integer("requires_lesson_id").notNull(),
  },
  (t) => ({ lessonIdx: index("lesson_prereq_lesson_idx").on(t.lessonId) })
);

export const userLessonProgress = pgTable(
  "user_lesson_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    lessonId: integer("lesson_id").notNull(),
    progress: integer("progress").default(0),
    completed: boolean("completed").default(false),
    lastViewedAt: timestamp("last_viewed_at").defaultNow(),
    timeSpentSec: integer("time_spent_sec").default(0),
  },
  (t) => ({
    ulpUserIdx: index("ulp_user_idx").on(t.userId),
    ulpLessonIdx: index("ulp_lesson_idx").on(t.lessonId),
  })
);

export const userCourseProgress = pgTable(
  "user_course_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    courseId: integer("course_id").notNull(),
    progress: integer("progress").default(0),
    completed: boolean("completed").default(false),
  }
);

export const lmsEvents = pgTable(
  "lms_events",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    subjectType: varchar("subject_type", { length: 20 }).notNull(),
    subjectId: integer("subject_id").notNull(),
    action: varchar("action", { length: 20 }).notNull(),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at").defaultNow(),
    processedAt: timestamp("processed_at"),
  }
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

// ==========================
// Course Mates entities
// ==========================

export const schools = pgTable(
  "schools",
  {
    id: serial("id").primaryKey(),
    universityId: integer("university_id").notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ uniIdx: index("schools_university_idx").on(t.universityId) })
);

export const medicalSchoolCourses = pgTable(
  "medical_school_courses",
  {
    id: serial("id").primaryKey(),
    universityId: integer("university_id").notNull(),
    schoolId: integer("school_id"),
    slug: varchar("slug", { length: 160 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    degreeType: varchar("degree_type", { length: 32 }),
    language: varchar("language", { length: 24 }),
    durationYears: integer("duration_years"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    mscUniIdx: index("msc_university_idx").on(t.universityId),
    mscSchoolIdx: index("msc_school_idx").on(t.schoolId),
  })
);

export const studentOrganizations = pgTable(
  "student_organizations",
  {
    id: serial("id").primaryKey(),
    universityId: integer("university_id").notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    website: varchar("website", { length: 300 }),
    contactEmail: varchar("contact_email", { length: 200 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ orgUniIdx: index("orgs_university_idx").on(t.universityId) })
);

export const studentOrganizationSchools = pgTable(
  "student_organization_schools",
  {
    organizationId: integer("organization_id").notNull(),
    schoolId: integer("school_id").notNull(),
  },
  (t) => ({
    orgSchSchoolIdx: index("org_schools_school_idx").on(t.schoolId),
  })
);

export const studentOrganizationCourses = pgTable(
  "student_organization_courses",
  {
    organizationId: integer("organization_id").notNull(),
    courseId: integer("course_id").notNull(),
  },
  (t) => ({ orgCoursesCourseIdx: index("org_courses_course_idx").on(t.courseId) })
);

// Pending education requests requiring manual approval
export const userEducationRequests = pgTable(
  "user_education_requests",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    universityId: integer("university_id"),
    schoolId: integer("school_id"),
    medicalCourseId: integer("medical_course_id"),
    studyYear: integer("study_year"),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at"),
    reviewedBy: integer("reviewed_by"),
  },
  (t) => ({
    uerUserIdx: index("uer_user_idx").on(t.userId),
    uerStatusIdx: index("uer_status_idx").on(t.status),
  })
);

// ==========================
// Study Rooms (Isolated Area)
// All tables in this block are prefixed with `study_` so the feature
// can be dropped cleanly without affecting other tables.
// ==========================

export const studySessions = pgTable(
  "study_sessions",
  {
    id: serial("id").primaryKey(),
    // Each user has exactly one personal room
    creatorUserId: integer("creator_user_id").notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    sharedEndAt: timestamp("shared_end_at"),
    totalJoins: integer("total_joins").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ slugIdx: index("study_sessions_slug_idx").on(t.slug) })
);

export const studySessionParticipants = pgTable(
  "study_session_participants",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id").notNull(),
    userId: integer("user_id").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => ({
    sessionIdx: index("study_participants_session_idx").on(t.sessionId),
    userIdx: index("study_participants_user_idx").on(t.userId),
  })
);

export const studyMessages = pgTable(
  "study_messages",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id").notNull(),
    userId: integer("user_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    msgSessionIdx: index("study_messages_session_idx").on(t.sessionId),
    msgUserIdx: index("study_messages_user_idx").on(t.userId),
  })
);

export const studyTaskLists = pgTable(
  "study_task_lists",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id"),
    userId: integer("user_id").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    isGlobal: boolean("is_global").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    stlSessionIdx: index("study_task_lists_session_idx").on(t.sessionId),
    stlUserIdx: index("study_task_lists_user_idx").on(t.userId),
  })
);

export const studyTaskItems = pgTable(
  "study_task_items",
  {
    id: serial("id").primaryKey(),
    taskListId: integer("task_list_id").notNull(),
    name: varchar("name", { length: 400 }).notNull(),
    isCompleted: boolean("is_completed").default(false).notNull(),
    // Hierarchy + ordering
    parentItemId: integer("parent_item_id"),
    position: integer("position").default(0).notNull(),
    // Completion/Xp tracking
    completedAt: timestamp("completed_at"),
    xpAwarded: boolean("xp_awarded").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    stiListIdx: index("study_task_items_list_idx").on(t.taskListId),
    stiParentIdx: index("study_task_items_parent_idx").on(t.parentItemId),
    stiOrderIdx: index("study_task_items_order_idx").on(t.taskListId, t.position),
  })
);

export const studyUserMeta = pgTable(
  "study_user_meta",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    lastSessionSlug: varchar("last_session_slug", { length: 64 }),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({ userIdx: index("study_user_meta_user_idx").on(t.userId) })
);

// ==========================
// IMAT Planner (per-user meta tying to study_task_lists)
// ==========================

export const imatUserPlan = pgTable(
  "imat_user_plan",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    startDate: timestamp("start_date"),
    currentDay: integer("current_day"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("imat_user_plan_user_idx").on(t.userId),
  })
);

export const imatUserPlanTasks = pgTable(
  "imat_user_plan_tasks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    dayNumber: integer("day_number").notNull(),
    taskIndex: integer("task_index").notNull(),
    label: varchar("label", { length: 500 }),
    isCompleted: boolean("is_completed").default(false).notNull(),
    completedAt: timestamp("completed_at"),
    xpAwarded: boolean("xp_awarded").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    templateId: integer("template_id"),
  },
  (t) => ({
    planUserIdx: index("imat_plan_tasks_user_idx").on(t.userId),
    planDayIdx: index("imat_plan_tasks_day_idx").on(t.userId, t.dayNumber),
  })
);

export const imatTaskTemplates = pgTable(
  "imat_task_templates",
  {
    id: serial("id").primaryKey(),
    dayNumber: integer("day_number").notNull(),
    taskIndex: integer("task_index").notNull(),
    label: text("label").notNull(),
  },
  (t) => ({
    dayIdx: index("imat_templates_day_idx").on(t.dayNumber, t.taskIndex),
  })
);

// ---------------- Anki Integration (shared user accounts) ----------------

// Per-user JSON state for the Leo Tamagotchi feature used by the Anki add-on
export const ankiTamagotchi = pgTable(
  "anki_tamagotchi",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    state: jsonb("state").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("anki_tamagotchi_user_idx").on(t.userId),
    userUnique: uniqueIndex("anki_tamagotchi_user_unique").on(t.userId),
  })
);

// User star rating per glossary term
export const termRatings = pgTable(
  "term_ratings",
  {
    id: serial("id").primaryKey(),
    termSlug: varchar("term_slug", { length: 160 }).notNull(),
    userId: integer("user_id").notNull(),
    stars: integer("stars").notNull(), // 1..5
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: index("term_ratings_slug_idx").on(t.termSlug),
    userIdx: index("term_ratings_user_idx").on(t.userId),
    slugUserUnique: uniqueIndex("term_ratings_slug_user_unique").on(
      t.termSlug,
      t.userId
    ),
  })
);

// User comments per glossary term
export const termComments = pgTable(
  "term_comments",
  {
    id: serial("id").primaryKey(),
    termSlug: varchar("term_slug", { length: 160 }).notNull(),
    userId: integer("user_id").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: index("term_comments_slug_idx").on(t.termSlug),
    userIdx: index("term_comments_user_idx").on(t.userId),
  })
);
