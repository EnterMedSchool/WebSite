"use client";

import { useEffect } from "react";

/**
 * DevFetchGuard
 * - Client-side fetch wrapper to prevent accidental request storms.
 * - Cancels/drops requests when rate/concurrency limits are exceeded.
 * - Dev-only (no-op in production or when NEXT_PUBLIC_DEV_THROTTLE=0).
 */
export default function DevFetchGuard() {
  useEffect(() => {
    const enabled = String(
      // Prefer generic var; fall back to previous dev-only var for back-compat
      (process.env.NEXT_PUBLIC_FETCH_GUARD as any) ??
        (process.env.NEXT_PUBLIC_DEV_THROTTLE as any) ??
        "1"
    ) !== "0";
    if (!enabled || typeof window === "undefined" || !window.fetch) return;

    const MAX_RPS = Number(
      (process.env.NEXT_PUBLIC_FETCH_MAX_RPS as any) ??
        (process.env.NEXT_PUBLIC_DEV_MAX_RPS as any) ??
        30
    );
    const BURST = Number(
      (process.env.NEXT_PUBLIC_FETCH_BURST as any) ??
        (process.env.NEXT_PUBLIC_DEV_BURST as any) ??
        Math.max(60, MAX_RPS * 2)
    );
    const MAX_CONCURRENT = Number(
      (process.env.NEXT_PUBLIC_FETCH_MAX_CONCURRENT as any) ??
        (process.env.NEXT_PUBLIC_DEV_MAX_CONCURRENT as any) ??
        16
    );
    const CANCEL_DUP_MS = Number(
      (process.env.NEXT_PUBLIC_FETCH_CANCEL_DUP_MS as any) ??
        (process.env.NEXT_PUBLIC_DEV_CANCEL_DUP_MS as any) ??
        200
    );

    const originalFetch = window.fetch.bind(window);

    // Token bucket state
    let tokens = BURST;
    let lastRefill = Date.now();
    let inFlight = 0;

    // Track duplicates to cancel rapid-fire same-path requests
    const inflightByKey = new Map<string, Set<AbortController>>();
    const lastSeen = new Map<string, number>();

    function refill() {
      const now = Date.now();
      const delta = Math.max(0, now - lastRefill);
      const refillAmt = (delta / 1000) * MAX_RPS;
      tokens = Math.min(BURST, tokens + refillAmt);
      lastRefill = now;
    }

    function shouldDrop(): boolean {
      refill();
      if (inFlight >= MAX_CONCURRENT) return true;
      if (tokens < 1) return true;
      tokens -= 1;
      return false;
    }

    function notifyAnd429(pathname: string, source: string): Response {
      try {
        window.dispatchEvent(
          new CustomEvent("throttle-warning", {
            detail: { path: pathname, source },
          })
        );
      } catch {}
      return new Response(
        JSON.stringify({ error: "too_many_requests", hint: "DEV fetch guard" }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
            "X-Dev-Fetch-Guard": "1",
            "X-Throttle-Path": pathname,
            "Retry-After": "1",
          },
        }
      );
    }

    function normalizeKey(input: RequestInfo | URL, init?: RequestInit) {
      try {
        const method = (init?.method || (input as Request)?.method || "GET").toUpperCase();
        const url = new URL(typeof input === "string" ? input : (input as Request).url, window.location.origin);
        // Group by path only to catch duplicate storms with varying queries
        return `${method} ${url.pathname}`;
      } catch {
        return `${(init?.method || "GET").toUpperCase()} unknown`;
      }
    }

    // Patch fetch
    // eslint-disable-next-line
    (window as any).fetch = async function devGuardedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      try {
        // Only guard API calls (you can extend to all requests if desired)
        const url = typeof input === "string" ? input : (input as Request).url;
        if (!String(url).includes("/api/")) {
          return originalFetch(input as any, init);
        }

        if (shouldDrop()) {
          const key = normalizeKey(input, init);
          console.warn(`[DevFetchGuard] Dropped (rps/concurrency) ${key}`);
          const pathname = key.split(" ")[1] || "/api";
          return notifyAnd429(pathname, "client_guard_drop");
        }

        // Duplicate suppression for rapid-fire on same path
        const key = normalizeKey(input, init);
        const now = Date.now();
        const prev = lastSeen.get(key) ?? 0;
        lastSeen.set(key, now);

        const controllers = inflightByKey.get(key) ?? new Set<AbortController>();
        inflightByKey.set(key, controllers);

        if (now - prev <= CANCEL_DUP_MS && controllers.size > 0) {
          // Abort earlier duplicates and drop this one too
          for (const ctrl of controllers) ctrl.abort();
          controllers.clear();
          console.warn(`[DevFetchGuard] Cancelled duplicates ${key}`);
          const pathname = key.split(" ")[1] || "/api";
          return notifyAnd429(pathname, "client_guard_dupe");
        }

        const ctrl = new AbortController();
        controllers.add(ctrl);
        inFlight += 1;

        // Combine with user-provided signal when supported
        let signal: AbortSignal | undefined = ctrl.signal;
        try {
          const userSignal = init?.signal || (input as Request)?.signal;
          // @ts-ignore - AbortSignal.any is supported in modern browsers
          if (userSignal && typeof AbortSignal !== "undefined" && typeof (AbortSignal as any).any === "function") {
            // @ts-ignore
            signal = (AbortSignal as any).any([ctrl.signal, userSignal]);
          }
        } catch {}

        const nextInit: RequestInit = { ...(init || {}), signal };
        try {
          const res = await originalFetch(input as any, nextInit);
          try {
            if (res?.status === 429) {
              const pathFromHeader = res.headers.get("X-Throttle-Path") || "";
              const pathname = pathFromHeader || (key.split(" ")[1] || "/api");
              window.dispatchEvent(
                new CustomEvent("throttle-warning", {
                  detail: { path: pathname, source: "server_429" },
                })
              );
            }
          } catch {}
          return res;
        } finally {
          inFlight -= 1;
          controllers.delete(ctrl);
        }
      } catch (err) {
        // In case of unexpected errors in the guard, fall back to original fetch
        return originalFetch(input as any, init);
      }
    };

    console.info(
      `[DevFetchGuard] enabled: maxRps=${MAX_RPS}, burst=${BURST}, maxConcurrent=${MAX_CONCURRENT}, cancelDupMs=${CANCEL_DUP_MS}`
    );

    return () => {
      // Restore original fetch on unmount (HMR)
      // eslint-disable-next-line
      (window as any).fetch = originalFetch;
    };
  }, []);

  return null;
}
