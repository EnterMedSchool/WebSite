import type { Metadata } from "next";
import type { BlogArticleMeta } from "./types";

const defaultSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://entermedschool.com").replace(/\/$/, "");

export function buildArticleMetadata(meta: BlogArticleMeta, options?: { siteUrl?: string; indexable?: boolean }): Metadata {
  const siteUrl = (options?.siteUrl ?? defaultSiteUrl).replace(/\/$/, "");
  const canonicalUrl = `${siteUrl}${meta.slug}`;
  const robots = options?.indexable === true ? { index: true, follow: true } : { index: false, follow: false };

  const languageAlternates: Record<string, string> = {
    [meta.locales.default]: meta.slug,
  };
  if (meta.locales.alternates?.length) {
    for (const alternate of meta.locales.alternates) {
      languageAlternates[alternate.locale] = alternate.href;
    }
  }

  const heroImage = meta.heroImage;
  const ogImages = [
    {
      url: heroImage.src,
      width: heroImage.width ?? 1200,
      height: heroImage.height ?? 630,
      alt: heroImage.alt,
    },
  ];

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: meta.slug,
      languages: languageAlternates,
    },
    robots,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "article",
      url: canonicalUrl,
      locale: meta.locales.default,
      alternateLocale: meta.locales.available.filter((locale) => locale !== meta.locales.default),
      images: ogImages,
      publishedTime: new Date(meta.published).toISOString(),
      modifiedTime: new Date(meta.updated).toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [heroImage.src],
    },
  } satisfies Metadata;
}
