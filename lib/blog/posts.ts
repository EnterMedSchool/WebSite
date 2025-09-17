import type { BlogArticleMeta } from "./types";

const blogArticles: Record<string, BlogArticleMeta> = {
  imat: {
    slug: "/imat",
    source: "imat.html",
    title: "IMAT 2025: The Ultimate Guide From Start to Finish",
    description:
      "Complete IMAT 2025 roadmap: understand the exam format, build your study plan, and stay on top of deadlines to study medicine in Italy.",
    heroImage: {
      src: "https://entermedschool.b-cdn.net/wp-content/uploads/2024/05/Untitled-design.png",
      alt: "Student reviewing the IMAT 2025 roadmap with digital study planner",
      width: 1200,
      height: 630,
    },
    exam: "International Medical Admissions Test (IMAT)",
    country: "Italy",
    countryCode: "IT",
    educationLevels: ["Pre-med applicants", "International students"],
    personas: [
      "International students planning an English-taught medical degree in Italy",
      "Gap year applicants focused on the IMAT",
      "High school seniors preparing for admission exams abroad",
    ],
    tags: ["IMAT", "Admission Exams", "Study Medicine in Italy", "Exam Strategy", "Timeline"],
    published: "2024-12-23",
    updated: "2025-01-05",
    author: {
      name: "Ari Horesh",
      title: "Founder, EnterMedSchool & Medical Student at the University of Pavia",
      profile: "https://entermedschool.com",
      avatarInitials: "AH",
    },
    callToActions: [
      { label: "Build your IMAT study plan", href: "/imat-planner" },
      { label: "Explore the IMAT prep course", href: "/imat-course" },
    ],
    resources: [
      { label: "IMAT Prep Course", href: "/imat-course" },
      { label: "IMAT Study Planner (free)", href: "/imat-planner" },
      { label: "Community: Course Mates", href: "/course-mates" },
    ],
    map: {
      dataset: "Italy",
      countryName: "Italy",
      isoA3: "ITA",
      center: [12.56, 42.2],
      zoom: 3.75,
      examTag: "IMAT",
    },
    locales: {
      default: "en",
      available: ["en"],
    },
  },
};

export function listBlogArticles() {
  return Object.values(blogArticles);
}

export function getBlogArticleMetaBySlug(slug: string): BlogArticleMeta | undefined {
  return blogArticles[slug];
}

export function getBlogArticleMetaByPath(pathname: string): BlogArticleMeta | undefined {
  const normalised = pathname.replace(/^\/+/, "");
  const slug = normalised.split("/")[0];
  return blogArticles[slug];
}
