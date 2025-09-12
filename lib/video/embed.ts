// Small helpers to work with stored HTML embeds for lessons.

export function extractIframeSrc(html?: string | null): string | null {
  if (!html) return null;
  try {
    const m = html.match(/<iframe[^>]*\s+src=["']([^"']+)["'][^>]*>/i);
    if (m && m[1]) return m[1];
  } catch {}
  return null;
}

export function detectProviderFromSrc(src?: string | null): "bunny" | "youtube" | "unknown" {
  if (!src) return "unknown";
  try {
    const u = new URL(src);
    const h = u.hostname.toLowerCase();
    if (h.includes("mediadelivery.net")) return "bunny";
    if (h.includes("youtube.com") || h.includes("youtu.be") || h.includes("youtube-nocookie.com")) return "youtube";
  } catch {}
  return "unknown";
}

export function firstYouTubeFromBody(body?: string | null): string | null {
  if (!body) return null;
  // 1) Try iframe
  const ifSrc = extractIframeSrc(body);
  if (ifSrc && /youtube|youtu\.be|youtube-nocookie/.test(ifSrc)) return ifSrc;
  // 2) Try simple links
  const m = body.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[^\s"'<>]+|youtu\.be\/[A-Za-z0-9_-]{6,})/i);
  return m?.[0] || null;
}

export function isPremiumSrc(src?: string | null): boolean {
  // For now: Bunny embeds are premium; YT is free
  return detectProviderFromSrc(src) === "bunny";
}

