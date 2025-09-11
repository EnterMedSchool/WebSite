"use client";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

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

  useEffect(() => {
    if (start) {
      const to = Number.isFinite(value) ? value : 0;
      const step = () => {
        count.stop();
        count.set(0);
        const startTime = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - startTime) / (duration * 1000));
          count.set(t * to);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };
      step();
    }
  }, [start, value]);

  return (
    <motion.span className={className} aria-live="polite">
      {prefix}
      {rounded}
      {suffix}
    </motion.span>
  );
}

