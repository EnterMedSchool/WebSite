import { cookies, headers } from "next/headers";
import PlatformCookieSync from "@/components/home/PlatformCookieSync";
import { parsePlatformOverride, resolvePlatform } from "@/lib/platform";
import type { PlatformTarget } from "@/lib/platform";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const cookieKey = "ems-platform-home";

const getFirst = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) return value[0];
  return value;
};

export default async function HomePage({ searchParams = {} }: PageProps) {
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

  if (platform === "mobile") {
    const MobileHome = (await import("@/components/home/mobile/MobileHome")).default;
    return (
      <>
        {shouldSync ? <PlatformCookieSync cookieKey={cookieKey} desired={desiredCookie} /> : null}
        <MobileHome />
      </>
    );
  }

  const DesktopHome = (await import("@/components/home/desktop/DesktopHome")).default;
  return (
    <>
      {shouldSync ? <PlatformCookieSync cookieKey={cookieKey} desired={desiredCookie} /> : null}
      <DesktopHome />
    </>
  );
}
