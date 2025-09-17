import path from "node:path";
import { promises as fs } from "node:fs";
import { load } from "cheerio";
import type { ArticleContent, ArticleHeading, BlogArticleMeta } from "./types";

const slugifyHeading = (value: string, seen: Set<string>) => {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const fallback = base || `section-${seen.size + 1}`;
  if (!seen.has(fallback)) {
    seen.add(fallback);
    return fallback;
  }
  let index = 2;
  let candidate = `${fallback}-${index}`;
  while (seen.has(candidate)) {
    index += 1;
    candidate = `${fallback}-${index}`;
  }
  seen.add(candidate);
  return candidate;
};

export async function getBlogArticleContent(meta: BlogArticleMeta): Promise<ArticleContent> {
  const filePath = path.join(process.cwd(), "public", "posts", meta.source);
  const raw = await fs.readFile(filePath, "utf8");
  const $ = load(raw);
  const articleRoot = $("main#content article");
  const article = articleRoot.length ? articleRoot.first() : $("article").first();

  article.find("script, style, header, footer, nav, aside").remove();

  const seenIds = new Set<string>();
  const headings: ArticleHeading[] = [];

  article.find("h2, h3").each((_, current) => {
    const element = $(current);
    const text = element.text().trim();
    if (!text) return;
    const rawLevel = current.tagName?.replace(/[^0-9]/g, "");
    const level = rawLevel ? Number(rawLevel) : 2;
    let id = element.attr("id");
    if (!id || seenIds.has(id)) {
      id = slugifyHeading(text, seenIds);
      element.attr("id", id);
    } else {
      seenIds.add(id);
    }
    headings.push({ id, text, level });
  });

  article.find("a[href]").each((_, current) => {
    const element = $(current);
    const href = element.attr("href") ?? "";
    if (href.startsWith("#") || href.startsWith("/")) return;
    element.attr("rel", "noopener noreferrer");
    element.attr("target", "_blank");
  });

  const textContent = article.text().replace(/\s+/g, " ").trim();
  const wordCount = textContent ? textContent.split(/\s+/).length : 0;
  const readingMinutes = Math.max(3, Math.round(wordCount / 225));

  return {
    html: article.html() ?? "",
    headings,
    wordCount,
    readingMinutes,
  };
}
