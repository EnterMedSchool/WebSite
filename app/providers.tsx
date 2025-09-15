"use client";

import { SessionProvider } from "next-auth/react";
import React, { useMemo } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const hasAuth = useMemo(() => {
    if (typeof document === 'undefined') return false;
    return /(?:^|; )(__Secure-next-auth\.session-token|next-auth\.session-token)=/.test(document.cookie);
  }, []);
  React.useEffect(() => {
    // Redirect any legacy auth:open events to dedicated pages
    const onOpen = (e: any) => {
      try {
        const mode = e?.detail?.mode;
        const href = mode === 'signin' ? '/signin' : '/signup';
        window.location.assign(href);
      } catch {}
    };
    window.addEventListener('auth:open' as any, onOpen as any);
    return () => window.removeEventListener('auth:open' as any, onOpen as any);
  }, []);
  return (
    <SessionProvider session={hasAuth ? undefined : null} refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}
