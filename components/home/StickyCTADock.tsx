"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function StickyCTADock() {
  const [show, setShow] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setShow(!hidden && y > 900);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true } as any);
    return () => window.removeEventListener("scroll", onScroll as any);
  }, [hidden]);

  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-6 z-40 mx-auto w-full max-w-3xl px-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/80 p-3 shadow-[0_18px_48px_rgba(49,46,129,0.18)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/70">
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Jump into the Course Hub and try the new demos.</div>
        <div className="flex items-center gap-2">
          <Link href="/course-mates" className="rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-bold text-white shadow hover:brightness-110">Try Course Hub</Link>
          <button className="rounded-xl border border-slate-300/60 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white/90 dark:border-white/10 dark:bg-white/10 dark:text-slate-200" onClick={() => setHidden(true)}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

