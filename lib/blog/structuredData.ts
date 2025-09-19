import type { ArticleContent, BlogArticleMeta } from "./types";

export function buildArticleStructuredData(meta: BlogArticleMeta, article: ArticleContent, siteUrl: string): string {
  const articleUrl = `${siteUrl}${meta.slug}`;

  const articleStructuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: articleUrl,
    headline: meta.title,
    description: meta.description,
    image: [meta.heroImage.src],
    datePublished: new Date(meta.published).toISOString(),
    dateModified: new Date(meta.updated).toISOString(),
    author: {
      "@type": "Person",
      name: meta.author.name,
      jobTitle: meta.author.title,
      url: meta.author.profile,
    },
    publisher: {
      "@type": "Organization",
      name: "EnterMedSchool",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.svg`,
      },
    },
    inLanguage: meta.locales.default,
    availableLanguage: meta.locales.available,
    isAccessibleForFree: true,
    timeRequired: `PT${article.readingMinutes}M`,
    wordCount: article.wordCount,
  };

  if (meta.tags?.length) {
    articleStructuredData.keywords = meta.tags.join(", ");
  }

  const about: Array<Record<string, string>> = [];
  if (meta.exam) about.push({ "@type": "Thing", name: meta.exam });
  if (meta.country) about.push({ "@type": "Place", name: meta.country });
  if (about.length) {
    articleStructuredData.about = about;
  }

  if (meta.educationLevels?.length) {
    articleStructuredData.audience = {
      "@type": "EducationalAudience",
      educationalRole: meta.educationLevels.join(", "),
    };
  }

  if (meta.country) {
    articleStructuredData.contentLocation = {
      "@type": "Country",
      name: meta.country,
    };
  }

  return JSON.stringify(
    [
      articleStructuredData,
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: meta.title,
            item: articleUrl,
          },
        ],
      },
    ],
    null,
    0,
  );
}
