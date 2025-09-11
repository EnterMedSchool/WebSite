"use client";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import Image from "next/image";
import AnimatedCounter from "./AnimatedCounter";
import type { Milestone } from "@/content/milestones";

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 2l1.6 3.9L18 7.6l-3.9 1.6L12 13l-2.1-3.8L6 7.6l4.4-1.7L12 2z" fill="currentColor" opacity=".9"/>
      <circle cx="19" cy="6" r="1.5" fill="currentColor" opacity=".5" />
      <circle cx="5" cy="9" r="1" fill="currentColor" opacity=".4" />
    </svg>
  );
}

export default function ImpactCard({
  item,
  focused,
  onOpen,
  onFocus,
}: {
  item: Milestone;
  focused: boolean;
  onOpen: (item: Milestone) => void;
  onFocus?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [shinePos, setShinePos] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const handlePointer = (e: React.PointerEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setShinePos({ x, y });
  };

  return (
    <motion.div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onFocus={onFocus}
      onPointerMove={handlePointer}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(item); } }}
      className="group relative h-[360px] w-[520px] cursor-pointer select-none rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/20 to-slate-900/0 p-6 text-left shadow-[0_10px_40px_rgba(49,46,129,0.15)] backdrop-blur-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 overflow-hidden"
      style={{
        transformPerspective: 900,
        rotateX: hovered ? -(shinePos.y - 50) / 8 : 0,
        rotateY: hovered ? (shinePos.x - 50) / 8 : 0,
      }}
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: focused ? 1 : 0.99 }}
      transition={{ type: 'spring', stiffness: 140, damping: 18 }}
    >
      {/* Media */}
      {item.image && (
        <div className="absolute inset-0 -z-10">
          <Image
            src={item.image.src}
            alt={item.image.alt}
            fill
            sizes="520px"
            className="object-cover"
            priority={false}
          />
          {/* Scrim for legibility */}
          <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(800px_220px_at_50%_-20%,rgba(4,7,29,.45),transparent_60%)]"></div>
        </div>
      )}

      {/* Shine highlight following pointer */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          background: `radial-gradient(200px 220px at ${shinePos.x}% ${shinePos.y}%, rgba(255,255,255,0.12), transparent 40%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 text-indigo-100/90">
          <SparkleIcon className="h-4 w-4 text-cyan-200" />
          <span className="text-xs font-medium tracking-wider uppercase opacity-80">{item.year ?? 'Milestone'}</span>
        </div>
        <h3 className="mt-3 text-2xl font-semibold text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
          {item.title}
        </h3>
        <p className="mt-2 max-w-[44ch] text-sm leading-6 text-indigo-50/90">
          {item.subtitle}
        </p>
        {item.metric && (
          <div className="mt-6 flex items-end gap-3">
            <AnimatedCounter
              value={item.metric.value}
              start={focused}
              prefix={item.metric.prefix}
              suffix={item.metric.suffix}
              className="text-5xl font-extrabold tracking-tight text-white"
            />
            <span className="mb-2 text-sm text-indigo-50/80">{item.metric.label}</span>
          </div>
        )}
      </div>

      {/* Glows / accents */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          boxShadow: focused
            ? `inset 0 0 0 1px rgba(255,255,255,0.35), 0 40px 120px -40px ${item.accent}66`
            : `inset 0 0 0 1px rgba(255,255,255,0.15)`,
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl"
        style={{ background: item.accent, opacity: focused ? 0.45 : 0.2 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full blur-2xl"
        style={{ background: item.accent, opacity: focused ? 0.35 : 0.15 }}
      />

      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 text-indigo-50/80">
        <span className="text-xs">Learn more</span>
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </div>
    </motion.div>
  );
}
