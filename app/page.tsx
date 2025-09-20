import { cookies, headers } from "next/headers";

import PlatformCookieSync from "@/components/home/PlatformCookieSync";
import { authGetServerSession } from "@/lib/auth";
import { loadDashboardContext } from "@/lib/dashboard/context";
import OnboardingRoot from "@/components/onboarding/OnboardingRoot";
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
  const session = await authGetServerSession();
  const isLoggedIn = !!session;
  const viewOverrideRaw = getFirst(searchParams.view);
  const forceShowcase = viewOverrideRaw === "showcase";

  const dashboardContext = isLoggedIn && !forceShowcase ? await loadDashboardContext(session as any) : null;
  const onboardingContext = dashboardContext ?? null;
  const shouldShowShowcase = !isLoggedIn || forceShowcase || dashboardContext?.view === "showcase";

  const headerStore = headers();
  const cookieStore = cookies();
  const queryOverrideRaw = getFirst(searchParams.platform);
  const cookieOverrideRaw = cookieStore.get(cookieKey)?.value;

  const fallbackTarget: PlatformTarget = shouldShowShowcase ? "desktop" : "mobile";
  const platform = resolvePlatform({
    userAgent: headerStore.get("user-agent") ?? undefined,
    hintMobile: headerStore.get("sec-ch-ua-mobile") ?? undefined,
    override: queryOverrideRaw ?? cookieOverrideRaw ?? undefined,
    fallback: fallbackTarget,
  });

  const queryOverride = parsePlatformOverride(queryOverrideRaw);
  const cookieOverride = parsePlatformOverride(cookieOverrideRaw);
  const desiredCookie: PlatformTarget = queryOverride ?? platform;
  const shouldSync = desiredCookie !== cookieOverride;

  if (shouldShowShowcase) {
    const ShowcaseHome = (await import("@/components/home/desktop/DesktopHome")).default;
    return (
      <>
        {shouldSync ? <PlatformCookieSync cookieKey={cookieKey} desired={desiredCookie} /> : null}
        <ShowcaseHome />
        {onboardingContext ? <OnboardingRoot context={onboardingContext} /> : null}
      </>
    );
  }

  const resolvedContext = dashboardContext!;
  const stageView = resolvedContext.view ?? "admissions-dashboard";
  const showcaseHref = "/?view=showcase";

  if (platform === "mobile") {
    if (stageView === "medical-dashboard" || stageView === "resident-dashboard") {
      const MobileMedicalDashboard = (await import("@/components/home/dashboard/medical/MobileMedicalDashboard")).default;
      return (
        <>
          {shouldSync ? <PlatformCookieSync cookieKey={cookieKey} desired={desiredCookie} /> : null}
          <MobileMedicalDashboard context={resolvedContext} showcaseHref={showcaseHref} />
          <OnboardingRoot context={resolvedContext} />
        </>
      );
    }

    const MobileAdmissionsDashboard = (await import("@/components/home/dashboard/admissions/MobileAdmissionsDashboard")).default;
    return (
      <>
        {shouldSync ? <PlatformCookieSync cookieKey={cookieKey} desired={desiredCookie} /> : null}
        <MobileAdmissionsDashboard context={resolvedContext} showcaseHref={showcaseHref} />
        <OnboardingRoot context={resolvedContext} />
      </>
    );
  }

  if (stageView === "medical-dashboard" || stageView === "resident-dashboard") {
    const DesktopMedicalDashboard = (await import("@/components/home/dashboard/medical/DesktopMedicalDashboard")).default;
    return (
      <>
        {shouldSync ? <PlatformCookieSync cookieKey={cookieKey} desired={desiredCookie} /> : null}
        <DesktopMedicalDashboard context={resolvedContext} showcaseHref={showcaseHref} />
        <OnboardingRoot context={resolvedContext} />
      </>
    );
  }

  const DesktopAdmissionsDashboard = (await import("@/components/home/dashboard/admissions/DesktopAdmissionsDashboard")).default;
  return (
    <>
      {shouldSync ? <PlatformCookieSync cookieKey={cookieKey} desired={desiredCookie} /> : null}
      <DesktopAdmissionsDashboard context={resolvedContext} showcaseHref={showcaseHref} />
      <OnboardingRoot context={resolvedContext} />
    </>
  );
}
