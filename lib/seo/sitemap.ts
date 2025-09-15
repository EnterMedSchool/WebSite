import { SITEMAP_CONFIG, type ChangeFreq, type SitemapEntry } from "./config";

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export function allowIndexing() {
  return process.env.NEXT_PUBLIC_ALLOW_INDEX === "true";
}

export function toEntry(path: string, opts?: {
  lastModified?: Date | string;
  changefreq?: ChangeFreq;
  priority?: number;
}): SitemapEntry {
  const base = getBaseUrl().replace(/\/$/, "");
  const loc = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  return {
    loc,
    lastmod: opts?.lastModified
      ? (opts.lastModified instanceof Date
          ? opts.lastModified.toISOString()
          : new Date(opts.lastModified).toISOString())
      : undefined,
    changefreq: opts?.changefreq ?? SITEMAP_CONFIG.defaultChangeFreq,
    priority: opts?.priority ?? SITEMAP_CONFIG.defaultPriority,
  };
}

export function filterAllowed(paths: string[]): string[] {
  const ex = SITEMAP_CONFIG.exclude;
  return paths.filter((p) => {
    // Basic prefix match
    if (ex.some((x) => p === x || p.startsWith(`${x}/`))) return false;
    // Regex support when entry starts and ends with /
    for (const pat of ex) {
      if (pat.length > 2 && pat.startsWith("/") && pat.endsWith("/") && pat !== "/") {
        const re = new RegExp(pat.slice(1, -1));
        if (re.test(p)) return false;
      }
    }
    return true;
  });
}

export function buildUrlSet(entries: SitemapEntry[]): string {
  const xmlItems = entries
    .map((e) => {
      const lastmod = e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : "";
      const cf = e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : "";
      const pr = typeof e.priority === "number" ? `<priority>${e.priority.toFixed(1)}</priority>` : "";
      return `<url><loc>${escapeXml(e.loc)}</loc>${lastmod}${cf}${pr}</url>`;
    })
    .join("");
  const stylesheet = `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>`;
  return `<?xml version="1.0" encoding="UTF-8"?>` + stylesheet +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xmlItems}</urlset>`;
}

export function buildSitemapIndex(urls: string[]): string {
  const xmlItems = urls
    .map((u) => `<sitemap><loc>${escapeXml(u)}</loc></sitemap>`)
    .join("");
  const stylesheet = `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>`;
  return `<?xml version="1.0" encoding="UTF-8"?>` + stylesheet +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xmlItems}</sitemapindex>`;
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
