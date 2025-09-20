import type { DashboardExamTrack } from "@/lib/dashboard/context";

type HeroStat = { label: string; value: string; meta: string };
type QuickAction = { title: string; copy: string; href: string; badge: string; meta: string };
type TimelineEntry = { title: string; detail: string; status: "complete" | "active" | "upcoming" };
type ResourceCard = { title: string; description: string; href: string; tag: string };
type MapSpotlight = { name: string; city: string; seats: number; trend: string; highlight: string; tags: string[] };
type ArticleCard = { title: string; excerpt: string; href: string; badge: string };
type CohortRoom = { title: string; detail: string; activity: string; memberCount: string; href: string };
type CohortSpotlight = { name: string; status: string; focus: string; href: string };
type LeaderboardEntry = { rank: number; name: string; location: string; xp: number; delta: number; streak: number; highlight: string };
type QuestionBankItem = { id: string; title: string; topic: string; difficulty: "Easy" | "Medium" | "Hard"; timeAgo: string; href: string; peers: number };
type XPSeriesPoint = { day: string; xp: number; questions: number };
type XPMetrics = { totalXP: number; weeklyGoal: number; questions: number; streak: number; label: string; series: XPSeriesPoint[] };
type ChapterProgress = { course: string; chapter: string; lessonCompletion: number; questionCompletion: number; lessonsRemaining: number; questionsRemaining: number; href: string };

type AdmissionsContent = {
  heroStats: HeroStat[];
  quickActions: QuickAction[];
  timeline: TimelineEntry[];
  lessons: ResourceCard[];
  articles: ArticleCard[];
  map: MapSpotlight[];
  cohortRooms: CohortRoom[];
  cohortSpotlights: CohortSpotlight[];
  leaderboard: LeaderboardEntry[];
  questionBank: QuestionBankItem[];
  xp: XPMetrics;
  chapters: ChapterProgress[];
};

const DEFAULT_LESSONS: ResourceCard[] = [
  {
    title: "Build your admissions map",
    description: "Align deadlines, documents, and mock exams in one flow.",
    href: "/planner",
    tag: "Planner",
  },
  {
    title: "Scholarship checklist",
    description: "Track forms, language certificates, and campus interviews.",
    href: "/articles/scholarships",
    tag: "Scholarships",
  },
  {
    title: "Adaptive lesson queue",
    description: "Fifteen minute refreshers tuned to your weak spots.",
    href: "/lesson/discover",
    tag: "Lessons",
  },
];

const DEFAULT_ARTICLES: ArticleCard[] = [
  {
    title: "Admissions strategy: from shortlist to seat",
    excerpt: "Use dual timelines when juggling more than one exam track.",
    href: "/blog/admissions-strategy",
    badge: "Strategy",
  },
  {
    title: "Mock exam playbook",
    excerpt: "Structure your final four weeks with targeted simulations.",
    href: "/blog/mock-exam-playbook",
    badge: "Exam prep",
  },
  {
    title: "Stress-proof interview prep",
    excerpt: "Pair case practice with calm routines five days before interview.",
    href: "/blog/interview-prep",
    badge: "Interviews",
  },
];

const DEFAULT_TIMELINE: TimelineEntry[] = [
  { title: "Assemble documents", detail: "Collect transcripts, ID copies, and translations.", status: "complete" },
  { title: "Mock exam window", detail: "Full-length simulation scheduled for Friday.", status: "active" },
  { title: "Scholarship submission", detail: "Upload financial forms and motivation letter.", status: "upcoming" },
  { title: "Campus interview", detail: "Confirm travel logistics and practice scenario responses.", status: "upcoming" },
];

const DEFAULT_MAP: MapSpotlight[] = [
  {
    name: "Humanitas University",
    city: "Milan, Italy",
    seats: 150,
    trend: "+5 vs 2023",
    highlight: "Scholarship interviews closing soon",
    tags: ["Private", "Scholarships"],
  },
  {
    name: "University of Pavia",
    city: "Pavia, Italy",
    seats: 140,
    trend: "+2 vs 2023",
    highlight: "Cutoff 42.3, chemistry weighting heavy",
    tags: ["Public", "High ranking"],
  },
  {
    name: "La Sapienza",
    city: "Rome, Italy",
    seats: 80,
    trend: "Stable",
    highlight: "Biology bias in latest exam blueprint",
    tags: ["Public", "Competitive"],
  },
];

const DEFAULT_COHORT_ROOMS: CohortRoom[] = [
  {
    title: "Study sprint room",
    detail: "Morning accountability block and daily goal check-in.",
    activity: "Live now",
    memberCount: "46 learners",
    href: "/study/rooms/admissions-sprint",
  },
  {
    title: "Interview drills",
    detail: "Scenario prompts and peer feedback twice a week.",
    activity: "Next: Thu 18:00",
    memberCount: "212 learners",
    href: "/study/rooms/interview-drills",
  },
  {
    title: "Resources exchange",
    detail: "Share notes, flashcards, and timeline templates.",
    activity: "Active today",
    memberCount: "128 learners",
    href: "/study/rooms/resources",
  },
];

const DEFAULT_COHORT_SPOTLIGHTS: CohortSpotlight[] = [
  { name: "Sara G.", status: "Planner locked", focus: "Mock exam Friday", href: "/study/peers/sara" },
  { name: "Noah E.", status: "Interview drills", focus: "Station 3 practice", href: "/study/peers/noah" },
  { name: "Lina M.", status: "Streak 14", focus: "Chemistry recap", href: "/study/peers/lina" },
];

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Amelia R.", location: "Milan, IT", xp: 8420, delta: 132, streak: 16, highlight: "Top mock percentile" },
  { rank: 2, name: "Jamal O.", location: "Rome, IT", xp: 8290, delta: 98, streak: 11, highlight: "Review sprint finisher" },
  { rank: 3, name: "Elena V.", location: "Naples, IT", xp: 8015, delta: 76, streak: 9, highlight: "Biology drills boost" },
  { rank: 4, name: "Marco D.", location: "Turin, IT", xp: 7840, delta: 54, streak: 6, highlight: "New streak this week" },
  { rank: 5, name: "Priya K.", location: "Florence, IT", xp: 7695, delta: 61, streak: 4, highlight: "Chapter reviews" },
];

const DEFAULT_QUESTION_BANK: QuestionBankItem[] = [
  { id: "q1", title: "Enzyme kinetics crossover question", topic: "Biology - Metabolism", difficulty: "Medium", timeAgo: "2h ago", href: "/qbank/enzyme-kinetics-crossover", peers: 28 },
  { id: "q2", title: "Torque balance with mixed forces", topic: "Physics - Mechanics", difficulty: "Hard", timeAgo: "6h ago", href: "/qbank/torque-balance-mixed", peers: 19 },
  { id: "q3", title: "Probability of compound events", topic: "Math - Statistics", difficulty: "Medium", timeAgo: "9h ago", href: "/qbank/probability-compound-events", peers: 23 },
  { id: "q4", title: "Critical reading: data interpretation", topic: "Critical Thinking", difficulty: "Easy", timeAgo: "1d ago", href: "/qbank/critical-reading-data", peers: 34 },
];

const DEFAULT_XP_SERIES: XPSeriesPoint[] = [
  { day: "Mon", xp: 780, questions: 24 },
  { day: "Tue", xp: 860, questions: 28 },
  { day: "Wed", xp: 910, questions: 26 },
  { day: "Thu", xp: 1020, questions: 30 },
  { day: "Fri", xp: 980, questions: 27 },
  { day: "Sat", xp: 1140, questions: 34 },
  { day: "Sun", xp: 880, questions: 26 },
];

const DEFAULT_CHAPTERS: ChapterProgress[] = [
  {
    course: "Intensive IMAT Prep",
    chapter: "Chemistry foundations",
    lessonCompletion: 72,
    questionCompletion: 64,
    lessonsRemaining: 2,
    questionsRemaining: 18,
    href: "/courses/imat-intensive/chemistry-foundations",
  },
  {
    course: "IMAT Crash Course",
    chapter: "Human physiology overview",
    lessonCompletion: 58,
    questionCompletion: 52,
    lessonsRemaining: 3,
    questionsRemaining: 24,
    href: "/courses/imat-crash-course/human-physiology",
  },
  {
    course: "Math Bootcamp",
    chapter: "Combinatorics essentials",
    lessonCompletion: 81,
    questionCompletion: 70,
    lessonsRemaining: 1,
    questionsRemaining: 12,
    href: "/courses/math-bootcamp/combinatorics-essentials",
  },
  {
    course: "Critical Thinking Studio",
    chapter: "Data interpretation labs",
    lessonCompletion: 63,
    questionCompletion: 55,
    lessonsRemaining: 2,
    questionsRemaining: 16,
    href: "/courses/critical-thinking/data-interpretation",
  },
];

export function buildAdmissionsContent(track: DashboardExamTrack | undefined, primaryCountry: string | null): AdmissionsContent {
  const examLabel = track?.label ?? "Admissions track";
  const regionLabel = primaryCountry || track?.country || "Global";
  const shortRegion = regionLabel.split(/[\s,]+/)[0] ?? regionLabel;
  const shortExam = examLabel.split(/[\s-]+/)[0] ?? examLabel;

  const heroStats: HeroStat[] = [
    { label: "Focus", value: examLabel, meta: `Region: ${regionLabel}` },
    { label: "Checklist", value: "6 tasks", meta: "2 due this week" },
    { label: "Practice", value: "3 mocks", meta: `Next ${shortExam} review on Friday` },
    { label: "XP streak", value: "12 days", meta: "+2 vs last week" },
  ];

  const quickActions: QuickAction[] = [
    {
      title: `Continue ${examLabel} planner`,
      copy: `Review admissions milestones mapped to ${shortRegion}.`,
      href: "/planner",
      badge: "Planner",
      meta: "Last touched yesterday",
    },
    {
      title: "Resume adaptive lesson",
      copy: "Fifteen minute refresher targeted at your weak topics.",
      href: "/lesson/discover",
      badge: "15 min",
      meta: "Queued via study coach",
    },
    {
      title: "Review interview bank",
      copy: "Practice scenario prompts aligned with your track.",
      href: "/cases",
      badge: "New",
      meta: "4 open prompts",
    },
  ];

  const timeline = DEFAULT_TIMELINE.map((row) => {
    if (row.status !== "active") return row;
    return {
      ...row,
      detail: `Full-length simulation for ${examLabel} scheduled for Friday.`,
    } satisfies TimelineEntry;
  });

  const lessons = DEFAULT_LESSONS.map((card, index) =>
    index === 0
      ? {
          ...card,
          title: `Admissions map - ${examLabel}`,
          description: `Deadlines and documents tailored for ${regionLabel}.`,
        }
      : card,
  );

  const articles = DEFAULT_ARTICLES.map((article, index) =>
    index === 0
      ? {
          ...article,
          title: `${examLabel} strategy: from shortlist to seat`,
          excerpt: article.excerpt,
        }
      : {
          ...article,
          excerpt: index === 1 ? `Latest ${shortExam} mock schedule and scoring tips.` : article.excerpt,
        },
  );

  const map = DEFAULT_MAP.map((item, index) => {
    if (index === 0 && regionLabel.toLowerCase().includes("italy")) {
      return {
        ...item,
        highlight: `Timeline synced to your ${examLabel} intake`,
      } satisfies MapSpotlight;
    }
    return item;
  });

  const cohortRooms = DEFAULT_COHORT_ROOMS.map((room, index) => {
    if (index === 0) {
      return {
        ...room,
        title: `${examLabel} sprint room`,
        detail: `Accountability sprint for ${examLabel} candidates in ${shortRegion}.`,
      } satisfies CohortRoom;
    }
    return room;
  });

  const cohortSpotlights = DEFAULT_COHORT_SPOTLIGHTS.map((spotlight, index) => {
    if (index === 0) {
      return {
        ...spotlight,
        status: "Planner locked",
        focus: `${examLabel} mock on Friday`,
      } satisfies CohortSpotlight;
    }
    if (index === 1) {
      return {
        ...spotlight,
        focus: `${examLabel} interview station practice`,
      } satisfies CohortSpotlight;
    }
    return spotlight;
  });

  const leaderboard = DEFAULT_LEADERBOARD.map((entry, index) => {
    if (index === 0) {
      return {
        ...entry,
        highlight: `Leading this week's ${shortExam} streak`,
      } satisfies LeaderboardEntry;
    }
    if (index === 1) {
      return {
        ...entry,
        highlight: `${shortExam} drills complete`,
      } satisfies LeaderboardEntry;
    }
    return entry;
  });

  const questionBank = DEFAULT_QUESTION_BANK.map((item, index) => {
    if (index === 0) {
      return {
        ...item,
        topic: `${examLabel} - Metabolism`,
      } satisfies QuestionBankItem;
    }
    if (index === 1) {
      return {
        ...item,
        topic: `${examLabel} - Mechanics`,
      } satisfies QuestionBankItem;
    }
    return item;
  });

  const xpSeries = DEFAULT_XP_SERIES.map((point, index) =>
    index === DEFAULT_XP_SERIES.length - 1
      ? { ...point, xp: point.xp + 120, questions: point.questions + 4 }
      : point,
  );
  const xpTotal = xpSeries.reduce((sum, point) => sum + point.xp, 0);
  const xpQuestions = xpSeries.reduce((sum, point) => sum + point.questions, 0);
  const xp: XPMetrics = {
    totalXP: xpTotal,
    weeklyGoal: xpTotal + 420,
    questions: xpQuestions,
    streak: 12,
    label: examLabel,
    series: xpSeries,
  };

  const chapters = DEFAULT_CHAPTERS.map((chapter, index) => {
    if (index === 0) {
      return {
        ...chapter,
        course: `${examLabel} mastery`,
        chapter: `${shortExam} chemistry foundations`,
      } satisfies ChapterProgress;
    }
    return chapter;
  });

  return {
    heroStats,
    quickActions,
    timeline,
    lessons,
    articles,
    map,
    cohortRooms,
    cohortSpotlights,
    leaderboard,
    questionBank,
    xp,
    chapters,
  };
}

export type {
  AdmissionsContent,
  HeroStat,
  QuickAction,
  TimelineEntry,
  ResourceCard,
  MapSpotlight,
  ArticleCard,
  CohortRoom,
  CohortSpotlight,
  LeaderboardEntry,
  QuestionBankItem,
  XPMetrics,
  XPSeriesPoint,
  ChapterProgress,
};
