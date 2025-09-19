import { buildArticleStructuredData } from "@/lib/blog/structuredData";
import type { ArticleContent, BlogArticleMeta } from "@/lib/blog/types";
import MobileArticleClient from "./MobileArticleClient";

type Props = {
  meta: BlogArticleMeta;
  article: ArticleContent;
  siteUrl: string;
};

export default function MobileArticlePage({ meta, article, siteUrl }: Props) {
  const structuredData = buildArticleStructuredData(meta, article, siteUrl);
  return <MobileArticleClient meta={meta} article={article} structuredData={structuredData} />;
}

