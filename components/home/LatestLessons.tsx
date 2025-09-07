"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type Lesson = {
  id: string;
  title: string;
  thumb?: string;
  steps: number;
  questions: number;
  progress: number; // 0..100
  completed?: boolean;
};

const MOCK: Lesson[] = [
  { id: "1", title: "IMAT Biology: Cell Structure Essentials", steps: 7, questions: 24, progress: 40, thumb: undefined },
  { id: "2", title: "Chemistry Quickstart: Stoichiometry", steps: 6, questions: 18, progress: 0 },
  { id: "3", title: "Physics Fundamentals: Kinematics", steps: 8, questions: 30, progress: 70 },
  { id: "4", title: "Critical Thinking: Argument Evaluation", steps: 5, questions: 20, progress: 100, completed: true },
];

export default function LatestLessons() {
  const data = MOCK;
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [prog, setProg] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      const p = max <= 0 ? 0 : el.scrollLeft / max;
      setProg(p);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  function scrollBy(delta: number) {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }

  return (
    <section id="lessons" className="my-12">
      <div className="mb-3 flex items-end justify-between">
        <h3 className="text-xl font-bold tracking-tight">Latest mini‑lessons</h3>
        <a href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View all</a>
      </div>

      <div className="relative group">
        {/* chevrons (desktop) */}
        <button onClick={() => scrollBy(-320)} className="pointer-events-auto absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-800 shadow-md ring-1 ring-black/5 hover:bg-white lg:block opacity-0 group-hover:opacity-100 transition" aria-label="Prev">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        <button onClick={() => scrollBy(320)} className="pointer-events-auto absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-800 shadow-md ring-1 ring-black/5 hover:bg-white lg:block opacity-0 group-hover:opacity-100 transition" aria-label="Next">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
        </button>

        <div ref={scrollerRef} className="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-6">
          {data.map((l) => (
            <motion.article
              key={l.id}
              className="snap-start w-[300px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            >
              <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {l.thumb ? <img src={l.thumb} alt="thumb" className="h-full w-full object-cover"/> : (
                  <div className="flex h-full w-full items-center justify-center text-indigo-700/70">Thumbnail</div>
                )}
                {/* soft overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              </div>
              <div className="p-3">
                <h4 className="line-clamp-2 text-sm font-semibold text-gray-900">{l.title}</h4>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5">{l.steps} steps</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5">{l.questions} questions</span>
                  {l.completed && (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-700">
                      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      Done
                    </span>
                  )}
                </div>
                {/* progress */}
                <div className="mt-3">
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600" style={{ width: `${l.progress}%` }} />
                  </div>
                  <div className="mt-1 text-right text-[10px] text-gray-500">{l.progress}%</div>
                </div>
                <div className="mt-3 flex justify-between">
                  <button className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700">{l.progress>0 ? 'Continue' : 'Start'}</button>
                  <button className="rounded-lg border px-3 py-1 text-xs font-semibold hover:bg-gray-50">Details</button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* scroll progress */}
        <div className="pointer-events-none absolute inset-x-6 bottom-0">
          <div className="h-1 w-full rounded-full bg-gray-200">
            <div className="h-1 rounded-full bg-indigo-500" style={{ width: `${prog*100}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
