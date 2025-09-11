"use client";
import { motion, useMotionValue, useSpring, useTransform, useMotionValueEvent } from "framer-motion";
import { useEffect, useState } from "react";

export default function AnimatedCounter({
  value,
  start,
  duration = 1.2,
  prefix = "",
  suffix = "",
  className = "",
}: {
  value: number;
  start: boolean;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const count = useMotionValue(0);
  const spring = useSpring(count, { stiffness: 140, damping: 20 });
  const rounded = useTransform(spring, (latest) => Math.floor(latest).toLocaleString());
  const [display, setDisplay] = useState("0");

  useMotionValueEvent(rounded, "change", (latest) => {
    setDisplay(latest);
  });

  useEffect(() => {
    if (!start) return;
    const to = Number.isFinite(value) ? value : 0;

    count.stop();
    count.set(0);
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / (duration * 1000));
      count.set(t * to);
      if (t < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, value, duration, count]);

  return (
    <motion.span className={className} aria-live="polite">
      {prefix}
      {display}
      {suffix}
    </motion.span>
  );
}
