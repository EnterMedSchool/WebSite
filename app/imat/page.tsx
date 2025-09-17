import VibrantSectionStyles from "@/components/home/VibrantSectionStyles";
import ArticlePage from "@/components/blog/ArticlePage";
import { getBlogArticleMetaBySlug } from "@/lib/blog/posts";
import { getBlogArticleContent } from "@/lib/blog/content";
import { buildArticleMetadata } from "@/lib/blog/metadata";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://entermedschool.com").replace(/\/$/, "");

const meta = (() => {
  const resolved = getBlogArticleMetaBySlug("imat");
  if (!resolved) {
    throw new Error("IMAT article metadata is missing.");
  }
  return resolved;
})();

export const metadata = buildArticleMetadata(meta);

export default async function ImatPage() {
  const article = await getBlogArticleContent(meta);

  return (
    <>
      <VibrantSectionStyles />
      <ArticlePage meta={meta} article={article} siteUrl={siteUrl} />
    </>
  );
}
