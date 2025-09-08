"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

type Props = HTMLMotionProps<"div"> & {
  children: ReactNode;
  delay?: number;
  y?: number;
};

export default function Reveal({ children, delay = 0, y = 22, className, ...rest }: Props) {
  const prefersReduced = useReducedMotion();
  const initial = prefersReduced ? { opacity: 0 } : { opacity: 0, y };
  const animate = prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 };
  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
