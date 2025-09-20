"use client";

import { useEffect, useMemo, useState } from "react";

import type { DashboardContext, DashboardOnboarding } from "@/lib/dashboard/context";
import { ONBOARDING_LOCAL_KEY, ONBOARDING_VERSION } from "@/lib/onboarding/constants";

import OnboardingDialog from "./OnboardingDialog";

type OnboardingRootProps = {
  context?: DashboardContext | null;
};

const FALLBACK_CONTEXT: DashboardContext = {
  view: "showcase",
  stage: "guest",
  displayName: null,
  examTracks: [],
  primaryCountry: null,
  onboarding: { completedVersion: 0, completedAt: null, userType: null, shouldShow: false },
  needsOnboarding: false,
  needsSchoolRequest: false,
  schoolStatus: null,
  schoolId: null,
  schoolPreferences: null,
  dashboardPreferences: null,
};

const FALLBACK_STATUS: DashboardOnboarding = {
  completedVersion: 0,
  completedAt: null,
  userType: null,
  shouldShow: false,
};

const OPEN_EVENT = "ems:onboarding:open";

export default function OnboardingRoot({ context }: OnboardingRootProps) {
  const effectiveContext = useMemo(() => context ?? FALLBACK_CONTEXT, [context]);
  const effectiveStatus = effectiveContext.onboarding ?? FALLBACK_STATUS;

  const [open, setOpen] = useState(false);
  const [forced, setForced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const localValue = (() => {
      try {
        return window.localStorage.getItem(ONBOARDING_LOCAL_KEY);
      } catch {
        return null;
      }
    })();

    const localCompleted = localValue === String(ONBOARDING_VERSION);
    const serverCompleted = effectiveStatus.completedVersion >= ONBOARDING_VERSION;

    if (serverCompleted) {
      if (!localCompleted) {
        try {
          window.localStorage.setItem(ONBOARDING_LOCAL_KEY, String(ONBOARDING_VERSION));
        } catch {}
      }
      setForced(false);
      return;
    }

    if (effectiveStatus.shouldShow && !localCompleted) {
      setForced(true);
      setOpen(true);
    }
  }, [effectiveStatus.completedVersion, effectiveStatus.shouldShow]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      setForced(false);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, []);

  const handleClose = () => {
    if (forced) return;
    setOpen(false);
  };

  const handleCompleted = () => {
    try {
      window.localStorage.setItem(ONBOARDING_LOCAL_KEY, String(ONBOARDING_VERSION));
    } catch {}
    setForced(false);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <OnboardingDialog
      context={effectiveContext}
      status={effectiveStatus}
      forced={forced}
      onClose={handleClose}
      onCompleted={handleCompleted}
    />
  );
}
