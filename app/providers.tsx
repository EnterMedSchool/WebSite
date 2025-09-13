"use client";

import { SessionProvider } from "next-auth/react";
import React, { useMemo } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const hasAuth = useMemo(() => {
    if (typeof document === 'undefined') return false;
    return /(?:^|; )(__Secure-next-auth\.session-token|next-auth\.session-token)=/.test(document.cookie);
  }, []);
  return (
    <SessionProvider session={hasAuth ? undefined : null} refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}
