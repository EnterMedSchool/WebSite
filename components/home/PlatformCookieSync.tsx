"use client";

import { useEffect } from "react";
import type { PlatformTarget } from "@/lib/platform";

function readCookieValue(key: string): string | null {
  if (typeof document === "undefined") return null;
  const cookieString = document.cookie;
  if (!cookieString) return null;
  const parts = cookieString.split(";");
  for (const part of parts) {
    const [name, ...rest] = part.trim().split("=");
    if (name === key) {
      return rest.join("=");
    }
  }
  return null;
}

type PlatformCookieSyncProps = {
  cookieKey: string;
  desired?: PlatformTarget | null;
  enabled?: boolean;
};

export default function PlatformCookieSync({ cookieKey, desired, enabled = true }: PlatformCookieSyncProps) {
  useEffect(() => {
    if (!enabled || !desired) return;
    const current = readCookieValue(cookieKey);
    if (current === desired) return;

    const maxAge = 60 * 60 * 24 * 180; // ~6 months
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const expires = `; Max-Age=${maxAge}`;
    const sameSite = "; SameSite=Lax";
    document.cookie = `${cookieKey}=${desired}; Path=/` + sameSite + secure + expires;
  }, [cookieKey, desired, enabled]);

  return null;
}
