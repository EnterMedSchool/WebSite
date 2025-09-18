import { cookies, headers } from "next/headers";
import { parsePlatformOverride, resolvePlatform } from "@/lib/platform";

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

  if (queryOverride) {
    cookieStore.set(cookieKey, queryOverride, {
      httpOnly: false,
      sameSite: "lax",
      secure: headerStore.get("x-forwarded-proto") === "https",
      path: "/",
    });
  } else if (!cookieOverride || cookieOverride !== platform) {
    cookieStore.set(cookieKey, platform, {
      httpOnly: false,
      sameSite: "lax",
      secure: headerStore.get("x-forwarded-proto") === "https",
      path: "/",
    });
  }

  if (platform === "mobile") {
    const MobileHome = (await import("@/components/home/mobile/MobileHome")).default;
    return <MobileHome />;
  }

  const DesktopHome = (await import("@/components/home/desktop/DesktopHome")).default;
  return <DesktopHome />;
}
