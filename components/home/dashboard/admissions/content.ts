import type { DashboardExamTrack } from "@/lib/dashboard/context";

type HeroStat = { label: string; value: string; meta: string };
type QuickAction = { title: string; copy: string; href: string; badge: string; meta: string };
type TimelineEntry = { title: string; detail: string; status: "complete" | "active" | "upcoming" };
type ResourceCard = { title: string; description: string; href: string; tag: string };
type MapSpotlight = { name: string; city: string; seats: number; trend: string; highlight: string; tags: string[] };
type ArticleCard = { title: string; excerpt: string; href: string; badge: string };
type CohortRoom = { title: string; detail: string; activity: string; memberCount: string; href: string };
type CohortSpotlight = { name: string; status: string; focus: string; href: string };

type AdmissionsContent = {
  heroStats: HeroStat[];
  quickActions: QuickAction[];
  timeline: TimelineEntry[];
  lessons: ResourceCard[];
  articles: ArticleCard[];
  map: MapSpotlight[];
  cohortRooms: CohortRoom[];
  cohortSpotlights: CohortSpotlight[];
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

export function buildAdmissionsContent(track: DashboardExamTrack | undefined, primaryCountry: string | null): AdmissionsContent {
  const examLabel = track?.label ?? "Admissions track";
  const regionLabel = primaryCountry || track?.country || "Global";
  const shortRegion = regionLabel.split(/[\s,]+/)[0] ?? regionLabel;

  const heroStats: HeroStat[] = [
    { label: "Focus", value: examLabel, meta: `Region: ${regionLabel}` },
    { label: "Checklist", value: "6 tasks", meta: "2 due this week" },
    { label: "Practice", value: "3 mocks", meta: "Next on Friday" },
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
      : article,
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

  return { heroStats, quickActions, timeline, lessons, articles, map, cohortRooms, cohortSpotlights };
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
};
