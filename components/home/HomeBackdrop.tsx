"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import LeoLogo from "@/assets/LeoLogoWebsite.png";

export default function HomeBackdrop() {
  const [y, setY] = useState(0);

  useEffect(() => {
    const onScroll = () => setY(window.scrollY || 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true } as any);
    return () => window.removeEventListener("scroll", onScroll as any);
  }, []);

  // Gentle parallax factors (smaller = slower)
  const a = y * 0.06;
  const b = y * 0.04;
  const c = y * 0.03;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
      {/* Global background gradient (top tint -> clean page bg) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(99,102,241,0.08)_0%,rgba(99,102,241,0.05)_240px,rgba(246,247,251,1)_800px)]" />
      {/* Soft radial vignettes to avoid banding */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-96 rounded-full bg-indigo-300/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-120px] top-1/3 h-96 w-[520px] rounded-full bg-violet-300/10 blur-3xl" />

      {/* Subtle floating lions (brand easter eggs) */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-[6%] top-[220px] opacity-[0.06] saturate-150"
          style={{ transform: `translate3d(0, ${a}px, 0) rotate(-10deg) scale(0.65)` }}
        >
          <Image src={LeoLogo} alt="" width={64} height={64} priority aria-hidden />
        </div>
        <div
          className="absolute right-[8%] top-[520px] opacity-[0.06] saturate-150"
          style={{ transform: `translate3d(0, ${b}px, 0) rotate(8deg) scale(0.55)` }}
        >
          <Image src={LeoLogo} alt="" width={54} height={54} aria-hidden />
        </div>
        <div
          className="absolute left-[18%] bottom-[12%] opacity-[0.05] saturate-150"
          style={{ transform: `translate3d(0, ${c}px, 0) rotate(-4deg) scale(0.6)` }}
        >
          <Image src={LeoLogo} alt="" width={56} height={56} aria-hidden />
        </div>
      </div>
    </div>
  );
}

