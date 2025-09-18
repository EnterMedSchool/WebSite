export type PlatformTarget = "mobile" | "desktop";

const MOBILE_REGEX = /(android|iphone|ipod|ipad|opera mini|blackberry|windows phone)/i;

const normalize = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

export function parsePlatformOverride(value: string | null | undefined): PlatformTarget | null {
  const normalized = normalize(value);
  if (normalized === "mobile" || normalized === "phone" || normalized === "touch") {
    return "mobile";
  }
  if (normalized === "desktop" || normalized === "pc") {
    return "desktop";
  }
  return null;
}

export function resolvePlatform(params: {
  userAgent?: string | null;
  hintMobile?: string | null;
  override?: string | null;
  fallback?: PlatformTarget;
}): PlatformTarget {
  const {
    userAgent = "",
    hintMobile = "",
    override = null,
    fallback = "desktop",
  } = params;

  const forced = parsePlatformOverride(override);
  if (forced) return forced;

  const hint = normalize(hintMobile);
  if (hint === "?1" || hint === "1" || hint === "true") {
    return "mobile";
  }

  if (hint === "?0" || hint === "0" || hint === "false") {
    return "desktop";
  }

  if (MOBILE_REGEX.test(userAgent ?? "")) {
    return "mobile";
  }

  return fallback;
}
