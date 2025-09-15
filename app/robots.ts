import type { MetadataRoute } from "next";

// Global robots.txt: default to disallow indexing on non-production.
// Set NEXT_PUBLIC_ALLOW_INDEX="true" and NEXT_PUBLIC_SITE_URL accordingly when ready.
export default function robots(): MetadataRoute.Robots {
  const allow = process.env.NEXT_PUBLIC_ALLOW_INDEX === "true";
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  if (!allow) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: `${base}/sitemap.xml`,
    };
  }
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${base}/sitemap.xml`,
  };
}
