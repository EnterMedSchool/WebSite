"use client";

import { useReducedMotion } from "framer-motion";
import React from "react";

type Variant = "indigo" | "teal" | "amber" | "electric";
type Size = "sm" | "md" | "lg" | "xl";

export default function ShimmerHeading({
  title,
  pretitle,
  variant = "indigo",
  size = "lg",
  align = "left",
  className = "",
}: {
  title: React.ReactNode;
  pretitle?: string;
  variant?: Variant;
  size?: Size;
  align?: "left" | "center" | "right";
  className?: string;
}) {
  const reduce = useReducedMotion();

  const gradient = (
    variant === "teal"
      ? "linear-gradient(90deg,#0e7490 0%,#06b6d4 25%,#34d399 50%,#06b6d4 75%,#0e7490 100%)"
      : variant === "amber"
      ? "linear-gradient(90deg,#b45309 0%,#f59e0b 25%,#fb7185 50%,#f59e0b 75%,#b45309 100%)"
      : variant === "electric"
      ? "linear-gradient(90deg,#7dd3fc 0%,#60a5fa 18%,#a78bfa 38%,#22d3ee 58%,#93c5fd 78%,#e0e7ff 100%)"
      : "linear-gradient(90deg,#312e81 0%,#6366f1 20%,#a78bfa 40%,#06b6d4 60%,#6366f1 80%,#312e81 100%)"
  );

  const sizeClass =
    size === "xl"
      ? "text-[clamp(36px,12vw,110px)]"
      : size === "lg"
      ? "text-[clamp(28px,8vw,68px)]"
      : size === "md"
      ? "text-[clamp(24px,6vw,42px)]"
      : "text-[clamp(18px,5vw,32px)]";

  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  return (
    <div className={className} style={{ ["--shimmer-gradient" as any]: gradient } as React.CSSProperties}>
      {pretitle && (
        <div className={`select-none ${alignClass} text-[clamp(16px,3.5vw,22px)] font-extrabold tracking-tight ${
          variant === "teal"
            ? "text-teal-900/70"
            : variant === "amber"
            ? "text-amber-900/70"
            : variant === "electric"
            ? "text-white/95 drop-shadow-[0_2px_10px_rgba(255,255,255,0.35)]"
            : "text-indigo-900/70"
        }`}>
          {pretitle}
        </div>
      )}
      <div className={`${alignClass} select-none font-extrabold leading-[0.95] tracking-tight`}>
        <span className={`shimmer-text ${sizeClass}`}>{title}</span>
      </div>
      <style jsx>{`
        .shimmer-text {
          display: inline-block;
          color: transparent;
          background-image: var(--shimmer-gradient);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shimmer-move ${reduce ? "0s" : "10s"} linear infinite;
          text-shadow: 0 6px 30px rgba(99, 102, 241, 0.25);
        }
        @keyframes shimmer-move {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
}
