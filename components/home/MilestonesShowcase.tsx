"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import ImpactCard from "../ui/ImpactCard";
import AnimatedCounter from "../ui/AnimatedCounter";
import ConfettiBurst from "../ui/ConfettiBurst";
import { MILESTONES, type Milestone } from "@/content/milestones";
import Link from "next/link";

function useActiveIndex(count: number) {
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    const children = Array.from(el.querySelectorAll('[data-card]')) as HTMLElement[];
    let best = 0;
    let bestDist = Infinity;
    children.forEach((child, i) => {
      const boxCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(boxCenter - center);
      if (dist < bestDist) { best = i; bestDist = dist; }
    });
    setIndex(best);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll as any);
  }, [handleScroll]);

  const to = useCallback((i: number) => {
    const el = containerRef.current;
    if (!el) return;
    const child = el.querySelectorAll('[data-card]')[i] as HTMLElement | undefined;
    if (!child) return;
    child.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, []);

  return { index, setIndex, containerRef, to } as const;
}

export default function MilestonesShowcase() {
  const { index, containerRef, to } = useActiveIndex(MILESTONES.length);

  const accent = MILESTONES[index]?.accent ?? '#4F46E5';
  const bg = useMotionValue(0);
  const spring = useSpring(bg, { stiffness: 120, damping: 18 });
  const [modal, setModal] = useState<Milestone | null>(null);
  const [celebrated, setCelebrated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    bg.set(index);
    if (index === MILESTONES.length - 1 && !celebrated) {
      const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReduced) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2400);
      }
      setCelebrated(true);
    }
  }, [index, celebrated]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { to(Math.min(index + 1, MILESTONES.length - 1)); }
    if (e.key === 'ArrowLeft') { to(Math.max(index - 1, 0)); }
  };

  const gradientStyle = useMemo(() => ({
    background: `radial-gradient(900px 200px at 50% -10%, ${accent}26, transparent 70%), linear-gradient(180deg, rgba(4,7,29,0.00), rgba(4,7,29,0.08))`,
  }), [accent]);

  const progress = MILESTONES.length > 1 ? (index / (MILESTONES.length - 1)) * 100 : 100;

  return (
    <section
      aria-labelledby="milestones-title"
      className="relative mx-auto w-full max-w-6xl select-none"
      onKeyDown={handleKey}
    >
      <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[92%] -translate-x-1/2 rounded-[48px] blur-2xl" style={gradientStyle} />
      <header className="mb-4 flex items-end justify-between px-2">
        <div>
          <h2 id="milestones-title" className="text-2xl font-semibold text-slate-900 dark:text-white">Our Major Milestones</h2>
          <p className="text-sm text-slate-600/80 dark:text-slate-300/80">What we've done so far</p>
        </div>
        <div className="hidden md:flex items-center gap-2 pr-2">
          {MILESTONES.map((m, i) => (
            <button
              key={m.id}
              aria-label={`Go to ${m.title}`}
              onClick={() => to(i)}
              className={`h-2.5 w-2.5 rounded-full transition-all ${i === index ? 'w-10 bg-indigo-500' : 'bg-indigo-300/50'}`}
            />
          ))}
        </div>
      </header>

      <div className="mx-2 mb-2 h-1 rounded-full bg-indigo-300/30">
        <motion.div className="h-1 rounded-full bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400" initial={{ width: 0 }} animate={{ width: progress + '%' }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
      </div>

      <div
        ref={containerRef}
        className="hide-scrollbar relative flex snap-x snap-mandatory gap-6 overflow-x-auto px-2 py-2"
        style={{ perspective: '1200px' }}
      >
        {MILESTONES.map((item, i) => (
          <div key={item.id} data-card className="snap-center flex-none">
            <div style={{ width: 520 }}>
              <ImpactCard
                item={item}
                focused={i === index}
                onOpen={setModal}
                onFocus={() => to(i)}
              />
            </div>
          </div>
        ))}
        {showConfetti && (
          <div className="pointer-events-none absolute inset-0 z-10"><ConfettiBurst /></div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setModal(null)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="milestone-modal-title"
            className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-900/40 p-6 text-white shadow-2xl"
            initial={{ y: 20, scale: .98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 140, damping: 16 }}
            onClick={(e) => e.stopPropagation()}
            style={{ boxShadow: `0 40px 140px -40px ${modal.accent}66` }}
          >
            <button
              className="absolute right-3 top-3 rounded-full p-2 text-white/80 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-400/60"
              onClick={() => setModal(null)}
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <div className="flex items-center gap-3 text-indigo-200">
              <span className="text-xs font-medium tracking-wider uppercase opacity-80">{modal.year ?? 'Milestone'}</span>
            </div>
            <h3 id="milestone-modal-title" className="mt-2 text-2xl font-semibold">{modal.title}</h3>
            <p className="mt-2 text-indigo-100/80">{modal.subtitle}</p>
            {modal.metric && (
              <div className="mt-6 flex items-end gap-3">
                <AnimatedCounter
                  value={modal.metric.value}
                  start={true}
                  prefix={modal.metric.prefix}
                  suffix={modal.metric.suffix}
                  className="text-5xl font-extrabold tracking-tight"
                />
                <span className="mb-2 text-sm text-indigo-100/80">{modal.metric.label}</span>
              </div>
            )}
            {modal.link && (
              <div className="mt-6">
                <Link
                  href={modal.link}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_rgba(79,70,229,0.45)] hover:bg-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-300"
                >
                  Explore more
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </Link>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}

