"use client";

import { useEffect, useMemo, useState } from "react";
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
  // Subtle bob/rotate based on scroll (sinusoidal)
  const rotateA = useMemo(() => Math.sin(y * 0.003) * 6, [y]);
  const rotateB = useMemo(() => Math.sin(y * 0.0025 + 1) * -5, [y]);
  const rotateC = useMemo(() => Math.sin(y * 0.002) * 4, [y]);
  const scaleA = useMemo(() => 0.65 + Math.sin(y * 0.002) * 0.01, [y]);
  const scaleB = useMemo(() => 0.55 + Math.sin(y * 0.0025) * 0.01, [y]);
  const scaleC = useMemo(() => 0.60 + Math.sin(y * 0.0018) * 0.01, [y]);

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
      {/* Global background gradient (multi-stop for smoother transitions) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(99,102,241,0.10)_0,rgba(99,102,241,0.08)_120px,rgba(99,102,241,0.06)_260px,rgba(99,102,241,0.045)_420px,rgba(246,247,251,1)_980px)]" />
      {/* Soft radial vignettes to avoid banding */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-96 rounded-full bg-indigo-300/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-120px] top-1/3 h-96 w-[520px] rounded-full bg-violet-300/10 blur-3xl" />

      {/* Subtle floating lions (brand easter eggs) */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-[6%] top-[220px] opacity-[0.06] saturate-150 will-change-transform"
          style={{ transform: `translate3d(0, ${a}px, 0) rotate(${rotateA}deg) scale(${scaleA})` }}
        >
          <Image src={LeoLogo} alt="" width={64} height={64} priority aria-hidden />
        </div>
        <div
          className="absolute right-[8%] top-[520px] opacity-[0.06] saturate-150 will-change-transform"
          style={{ transform: `translate3d(0, ${b}px, 0) rotate(${rotateB}deg) scale(${scaleB})` }}
        >
          <Image src={LeoLogo} alt="" width={54} height={54} aria-hidden />
        </div>
        <div
          className="absolute left-[18%] bottom-[12%] opacity-[0.05] saturate-150 will-change-transform"
          style={{ transform: `translate3d(0, ${c}px, 0) rotate(${rotateC}deg) scale(${scaleC})` }}
        >
          <Image src={LeoLogo} alt="" width={56} height={56} aria-hidden />
        </div>
      </div>
    </div>
  );
}
