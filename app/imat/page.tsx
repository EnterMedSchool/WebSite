import { cookies, headers } from "next/headers";
import VibrantSectionStyles from "@/components/home/VibrantSectionStyles";
import PlatformCookieSync from "@/components/home/PlatformCookieSync";
import { parsePlatformOverride, resolvePlatform, type PlatformTarget } from "@/lib/platform";
import { getBlogArticleMetaBySlug } from "@/lib/blog/posts";
import { getBlogArticleContent } from "@/lib/blog/content";
import { buildArticleMetadata } from "@/lib/blog/metadata";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const cookieKey = "ems-platform-article";

const getFirst = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) return value[0];
  return value;
};

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://entermedschool.com").replace(/\/$/, "");

const meta = (() => {
  const resolved = getBlogArticleMetaBySlug("imat");
  if (!resolved) {
    throw new Error("IMAT article metadata is missing.");
  }
  return resolved;
})();

export const metadata = buildArticleMetadata(meta);

export default async function ImatPage({ searchParams = {} }: PageProps) {
  const headerStore = headers();
  const cookieStore = cookies();
  const queryOverrideRaw = getFirst(searchParams.platform);
  const cookieOverrideRaw = cookieStore.get(cookieKey)?.value;

  const platform = resolvePlatform({
    userAgent: headerStore.get("user-agent") ?? undefined,
    hintMobile: headerStore.get("sec-ch-ua-mobile") ?? undefined,
    override: queryOverrideRaw ?? cookieOverrideRaw ?? undefined,
  });

  const queryOverride = parsePlatformOverride(queryOverrideRaw);
  const cookieOverride = parsePlatformOverride(cookieOverrideRaw);
  const desiredCookie: PlatformTarget = queryOverride ?? platform;
  const shouldSync = desiredCookie !== cookieOverride;

  const article = await getBlogArticleContent(meta);

  if (platform === "mobile") {
    const MobileArticlePage = (await import("@/components/blog/mobile/MobileArticlePage")).default;
    return (
      <>
        <VibrantSectionStyles />
        {shouldSync ? <PlatformCookieSync cookieKey={cookieKey} desired={desiredCookie} /> : null}
        <MobileArticlePage meta={meta} article={article} siteUrl={siteUrl} />
      </>
    );
  }

  const ArticlePage = (await import("@/components/blog/ArticlePage")).default;
  return (
    <>
      <VibrantSectionStyles />
      {shouldSync ? <PlatformCookieSync cookieKey={cookieKey} desired={desiredCookie} /> : null}
      <ArticlePage meta={meta} article={article} siteUrl={siteUrl} />
    </>
  );
}
