import type { MetadataRoute } from "next";

// Global robots.txt: default to disallow indexing on this Vercel site.
// Set NEXT_PUBLIC_ALLOW_INDEX="true" to allow indexing when ready.
export default function robots(): MetadataRoute.Robots {
  const allow = process.env.NEXT_PUBLIC_ALLOW_INDEX === "true";
  if (!allow) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }
  return {
    rules: [{ userAgent: "*", allow: "/" }],
  };
}

