"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type Lesson = {
  id: number;
  slug: string;
  title: string;
  lengthMin: number | null;
  position: number;
  completed: boolean;
  qTotal: number;
  qCorrect: number;
  state?: "normal" | "locked" | "review" | "boss";
};

type Chapter = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  position: number;
  lessons: Lesson[];
};

export default function CourseTimeline({ slug, initial, courseTitle }: { slug: string; courseTitle: string; initial: { chapters: Chapter[]; nextCursor: string | null } }) {
  const [chapters, setChapters] = useState<Chapter[]>(initial.chapters || []);
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor ?? null);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [travel, setTravel] = useState<{ top: number; height: number; show: boolean } | null>(null);
  const [claimedChests, setClaimedChests] = useState<Record<number, number>>({});

  // Lazy load more chapters when sentinel enters viewport
  useEffect(() => {
    if (!cursor) return; // no more
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first?.isIntersecting) {
        (async () => {
          try {
            setLoading(true);
            const r = await fetch(`/api/course/${slug}/timeline?cursor=${encodeURIComponent(cursor)}&limit=4`, { credentials: "include" });
            const j = await r.json();
            if (j?.chapters?.length) setChapters((prev) => [...prev, ...j.chapters]);
            setCursor(j?.nextCursor ?? null);
          } finally {
            setLoading(false);
          }
        })();
      }
    }, { rootMargin: "1200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, slug]);

  // Find the next actionable lesson (first with pct < 100)
  const nextLesson = useMemo(() => {
    for (const ch of chapters) {
      for (const ls of ch.lessons) {
        const pct = pctForLesson(ls);
        if (pct < 100 && ls.state !== 'locked') return { lesson: ls, chapter: ch };
      }
    }
    return null;
  }, [chapters]);

  // Path travel animation from previously stored actionable index to the current one
  useEffect(() => {
    if (!nextLesson) return;
    // Flatten lessons
    const all: Lesson[] = [];
    chapters.forEach((c) => c.lessons.forEach((l) => all.push(l)));
    const currIdx = all.findIndex((l) => l.id === nextLesson.lesson.id);
    if (currIdx < 0) return;
    const key = `ems:course:lastIdx:${slug}`;
    let prevIdx = -1;
    try { prevIdx = Number(localStorage.getItem(key) || -1); } catch {}
    // Update stored value for next time
    try { localStorage.setItem(key, String(currIdx)); } catch {}
    if (!(prevIdx >= 0) || currIdx <= prevIdx) return;
    // Ensure both nodes are in DOM
    const container = containerRef.current;
    if (!container) return;
    const from = document.getElementById(`node-${all[prevIdx].id}`);
    const to = document.getElementById(`node-${all[currIdx].id}`);
    if (!from || !to) return;
    const crect = container.getBoundingClientRect();
    const r1 = from.getBoundingClientRect();
    const r2 = to.getBoundingClientRect();
    const top1 = r1.top - crect.top + r1.height / 2;
    const top2 = r2.top - crect.top + r2.height / 2;
    const top = Math.min(top1, top2);
    const dist = Math.abs(top2 - top1);
    setTravel({ top, height: 0, show: true });
    requestAnimationFrame(() => setTravel({ top, height: dist, show: true }));
    const t = setTimeout(() => setTravel(null), 1100);
    return () => clearTimeout(t);
  }, [nextLesson?.lesson?.id, chapters, slug]);

  // Listen for reward events to flash the chapter chest
  useEffect(() => {
    function onReward(e: any) {
      const d = e?.detail || {};
      if (d?.type !== 'chest') return;
      const key = String(d?.key || ''); // format: chapter_<id>
      const m = key.match(/chapter_(\d+)/);
      if (!m) return;
      const id = Number(m[1]);
      setClaimedChests((s) => ({ ...s, [id]: Date.now() }));
      setTimeout(() => setClaimedChests((s) => ({ ...s, [id]: 0 })), 1800);
    }
    window.addEventListener('reward:earned' as any, onReward as any);
    return () => window.removeEventListener('reward:earned' as any, onReward as any);
  }, []);

  // On mount, play pending flashes from localStorage once
  useEffect(() => {
    try {
      const acc: Record<number, number> = {};
      for (const ch of chapters) {
        const key = `ems:chest:flash:chapter_${ch.id}`;
        if (localStorage.getItem(key)) {
          acc[ch.id] = Date.now();
          localStorage.removeItem(key);
        }
      }
      if (Object.keys(acc).length) setClaimedChests((s) => ({ ...s, ...acc }));
    } catch {}
  }, [chapters.map((c) => c.id).join(',')]);

  // Smooth camera pan to next actionable node on mount
  useEffect(() => {
    if (!nextLesson) return;
    const id = `next-node-${nextLesson.lesson.id}`;
    const el = document.getElementById(id);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const y = window.scrollY + r.top - Math.max(80, window.innerHeight * 0.18);
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }, [nextLesson?.lesson?.id]);

  return (
    <div>
      {/* Sticky mini header with progress context */}
      <div className="sticky top-0 z-10 -mx-6 mb-3 border-b border-indigo-100/60 bg-gradient-to-r from-white/95 to-white/85 px-6 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-indigo-700">Course</div>
          <div className="truncate font-[var(--font-baloo,_inherit)] text-lg font-extrabold text-slate-900">{courseTitle}</div>
          <div className="text-xs text-slate-600">Timeline</div>
        </div>
      </div>

      <div className="relative mx-auto max-w-3xl" ref={containerRef}>
        {/* Vertical path line */}
        <div className="pointer-events-none absolute left-1/2 top-0 -ml-[2px] h-full w-1 bg-gradient-to-b from-indigo-200 via-indigo-100 to-transparent" />
        {travel && (
          <div
            className="pointer-events-none absolute left-1/2 -ml-[1px] w-[2px] rounded bg-gradient-to-b from-emerald-400 via-indigo-400 to-indigo-500"
            style={{ top: travel.top, height: travel.height, opacity: travel.show ? 1 : 0, transition: 'height 900ms cubic-bezier(.22,1,.36,1), opacity 300ms ease-out' }}
          />
        )}

        {chapters.map((ch) => (
          <section key={ch.id} className="relative">
            {/* Chapter header card */}
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }}
              className="mb-4 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Chapter {ch.position}</div>
                  <h2 className="text-lg font-bold text-slate-900">{ch.title}</h2>
                  {ch.description ? <p className="mt-1 text-sm text-slate-600">{ch.description}</p> : null}
                </div>
              </div>
            </motion.div>

            {/* Lessons nodes */}
            <ul className="mb-8 grid gap-12">
              {ch.lessons.map((ls, j) => (
                <li key={ls.id} className="relative">
                  {/* dotted connector between nodes */}
                  {j < ch.lessons.length - 1 && (
                    <span className="pointer-events-none absolute left-1/2 top-12 -ml-[1px] h-16 w-[2px] bg-gradient-to-b from-indigo-200 to-transparent" />
                  )}
                  <LessonNode slug={ls.slug} title={ls.title} data={ls} highlight={nextLesson?.lesson?.id === ls.id} idAttr={`node-${ls.id}`} />
                </li>
              ))}
              {/* Chapter reward chest node */}
              <li className="relative">
                <ChapterChestNode chapter={ch} highlight={!!claimedChests[ch.id]} />
              </li>
            </ul>
          </section>
        ))}

        <div ref={sentinelRef} />
        {loading && <div className="py-4 text-center text-sm text-slate-500">Loading more...</div>}
        {!cursor && !loading && <div className="py-6 text-center text-sm text-slate-400">End of course</div>}
      </div>
    </div>
  );
}

function pctForLesson(ls: Lesson) {
  const k = ls.qTotal > 0 ? (ls.qCorrect / ls.qTotal) : 0;
  const pct = Math.round(((ls.completed ? 1 : 0) + k) / 2 * 100);
  return Math.max(0, Math.min(100, pct));
}

function LessonNode({ slug, title, data, highlight, idAttr }: { slug: string; title: string; data: Lesson; highlight?: boolean; idAttr?: string }) {
  const target = pctForLesson(data);
  const [pct, setPct] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    try {
      const key = `ems:lesson-pct:${data.id}`;
      const prev = Number(localStorage.getItem(key) || "0");
      const from = Number.isFinite(prev) ? prev : 0;
      setPct(from);
      const to = target;
      const start = performance.now();
      const dur = 700;
      let raf = 0;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / dur);
        const v = from + (to - from) * t;
        setPct(Math.round(v));
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      localStorage.setItem(key, String(target));
      return () => cancelAnimationFrame(raf);
    } catch {
      setPct(target);
    }
  }, [data.id, target]);

  // Detect unlock transitions for celebratory pulse
  useEffect(() => {
    try {
      const skey = `ems:lesson-state:${data.id}`;
      const prev = localStorage.getItem(skey) || 'unknown';
      const curr = data.state || 'normal';
      if (prev === 'locked' && curr !== 'locked') {
        setUnlocked(true);
        const t = setTimeout(() => setUnlocked(false), 1500);
        return () => clearTimeout(t);
      }
      localStorage.setItem(skey, curr);
    } catch {}
  }, [data.state, data.id]);

  const baseColor = data.state === 'locked' ? "#cbd5e1" :
                   data.state === 'review' ? "#38bdf8" :
                   data.state === 'boss' ? "#f59e0b" : "#4f46e5";
  const color = target >= 100 ? "#10b981" : highlight ? "#6366f1" : baseColor;

  return (
    <div className="flex items-center justify-center" id={idAttr}>
      <div className="hidden w-[16%] sm:block" />
      <div className="flex w-full max-w-sm items-center gap-4">
        <div className={unlocked ? "animate-[pulse_800ms_ease-out_2] rounded-full" : ""}>
          <ProgressRing pct={pct} color={color} completed={target >= 100} state={data.state} />
        </div>
        <div className="flex-1">
          {data.state === 'locked' ? (
            <div className="block cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-400 shadow-sm ring-1 ring-black/5">
              <div className="line-clamp-2 text-sm font-semibold">{title}</div>
              <div className="mt-1 text-[11px]">🔒 Locked</div>
            </div>
          ) : (
            <Link href={`/lesson/${slug}`} className="block rounded-xl border border-indigo-100 bg-white px-3 py-2 shadow-sm ring-1 ring-black/5 hover:bg-indigo-50">
              <div className="line-clamp-2 text-sm font-semibold text-slate-900">{title}</div>
              <div className="mt-1 text-[11px] text-slate-500">{data.state === 'review' ? 'Review' : data.state === 'boss' ? 'Boss' : data.lengthMin ? `${data.lengthMin} min` : `Lesson`}</div>
            </Link>
          )}
        </div>
        {/* Removed "Jump here" badge per UX simplification */}
      </div>
      <div className="hidden w-[16%] sm:block" />
    </div>
  );
}

function ProgressRing({ pct, color, completed, state }: { pct: number; color: string; completed?: boolean; state?: "normal" | "locked" | "review" | "boss" }) {
  return (
    <div className="relative grid h-16 w-16 place-items-center">
      <div className="h-16 w-16 rounded-full" style={{ background: `conic-gradient(${color} ${pct}%, #e5e7eb 0)` }} />
      <div className="absolute h-12 w-12 rounded-full bg-white shadow ring-1 ring-inset ring-indigo-100" />
      <div className="pointer-events-none absolute select-none text-sm font-bold text-slate-700">
        {completed ? "✓" : state === 'boss' ? '★' : state === 'review' ? 'R' : `${Math.max(0, Math.min(99, pct))}%`}
      </div>
    </div>
  );
}

function ChapterChestNode({ chapter, highlight }: { chapter: Chapter; highlight?: boolean }) {
  const completed = chapter.lessons.length > 0 && chapter.lessons.every((l) => l.completed);
  return (
    <div className="flex items-center justify-center">
      <div className="hidden w-[16%] sm:block" />
      <div className="flex w-full max-w-sm items-center gap-4">
        <div className={`relative grid h-16 w-16 place-items-center ${highlight ? 'animate-[pulse_900ms_ease-out_2]' : ''}`}>
          <div className="h-16 w-16 rounded-full" style={{ background: `conic-gradient(${completed ? '#10b981' : '#eab308'} ${completed ? 100 : 65}%, #e5e7eb 0)` }} />
          <div className="absolute grid h-12 w-12 place-items-center rounded-full bg-white shadow ring-1 ring-inset ring-indigo-100">
            <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden>
              <defs>
                <linearGradient id="lc1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fde68a" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="lc2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
              {/* Body */}
              <rect x="6" y="22" width="52" height="30" rx="6" fill="url(#lc2)" stroke="#92400e" strokeWidth="2" />
              {/* Lid (animated on highlight) */}
              <g style={{ transformBox: 'fill-box', transformOrigin: '10% 50%', animation: highlight ? 'lidLift 900ms ease-out 1' as any : undefined }}>
                <rect x="8" y="16" width="48" height="12" rx="6" fill="url(#lc1)" stroke="#92400e" strokeWidth="2" />
              </g>
              {/* Shine sweep */}
              <rect x="6" y="22" width="52" height="30" rx="6" fill="url(#lc2)" opacity="0">
                <animate attributeName="opacity" from="0" to={highlight ? '0.25' : '0'} dur="900ms" fill="freeze" />
              </rect>
            </svg>
          </div>
          {/* CSS keyframes for lid lift + shimmer bar */}
          <style>{`@keyframes lidLift{0%{transform:rotate(0deg) translateY(0)}40%{transform:rotate(-10deg) translateY(-2px)}100%{transform:rotate(0deg) translateY(0)}}`}</style>
        </div>
        <div className="flex-1">
          <div className="rounded-xl border border-indigo-100 bg-white px-3 py-2 shadow-sm ring-1 ring-black/5">
            <div className="text-sm font-semibold text-slate-900">Chapter {chapter.position} Chest</div>
            <div className="mt-1 text-[11px] text-slate-500">{completed ? 'Claimed' : 'Complete all lessons to unlock'}</div>
          </div>
        </div>
      </div>
      <div className="hidden w-[16%] sm:block" />
    </div>
  );
}
