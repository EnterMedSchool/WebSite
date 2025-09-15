export type ChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export const SITEMAP_CONFIG = {
  // Include only clearly public, evergreen static pages here.
  staticPaths: [
    "/",
    "/imat-course",
    "/course-mates",
    "/leaderboard",
    "/graph",
  ],
  // Simple path-based exclusions. Prefix or regex supported.
  exclude: [
    "/admin",
    "/api",
    "/dashboard",
    "/me",
    "/signin",
    "/signup",
    "/password",
    "/verify-email",
    "/debug",
  ],
  defaultChangeFreq: "weekly" as ChangeFreq,
  defaultPriority: 0.5,
  // Optional fine-grained filters; return false to drop an entry
  filters: {
    lesson: (slug: string) => true,
    course: (slug: string) => true,
    university: (slug: string) => true,
    blog: (slug: string) => true,
  },
};

export type SitemapEntry = {
  loc: string;
  lastmod?: string; // ISO string
  changefreq?: ChangeFreq;
  priority?: number; // 0.0 - 1.0
};
