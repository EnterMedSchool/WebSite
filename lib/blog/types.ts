export type ArticleCallToAction = {
  label: string;
  href: string;
};

export type ArticleResourceLink = {
  label: string;
  href: string;
};

export type ArticleAuthor = {
  name: string;
  title: string;
  profile: string;
  avatarInitials?: string;
};

export type ArticleMapConfig = {
  dataset: string; // matches file in public/map/v1/countries/{dataset}.json
  countryName: string;
  isoA3?: string;
  center: [number, number];
  zoom: number;
  examTag?: string;
};

export type ArticleLocales = {
  default: string;
  available: string[];
  alternates?: Array<{ locale: string; href: string }>;
};

export type BlogArticleMeta = {
  slug: string; // canonical slug path, e.g. "/imat"
  source: string; // relative path to HTML content under /public/posts
  title: string;
  description: string;
  heroImage: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
  exam?: string;
  country?: string;
  countryCode?: string;
  educationLevels?: string[];
  personas?: string[];
  tags?: string[];
  published: string; // ISO date string
  updated: string; // ISO date string
  author: ArticleAuthor;
  callToActions?: ArticleCallToAction[];
  resources?: ArticleResourceLink[];
  map?: ArticleMapConfig;
  locales: ArticleLocales;
};

export type ArticleHeading = {
  id: string;
  text: string;
  level: number;
};

export type ArticleContent = {
  html: string;
  headings: ArticleHeading[];
  wordCount: number;
  readingMinutes: number;
};
