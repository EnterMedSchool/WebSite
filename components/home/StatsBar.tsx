"use client";

import { useEffect, useMemo, useState } from "react";

type Stat = { label: string; value: number; accent: string };

export default function StatsBar() {
  const base: Stat[] = useMemo(
    () => [
      { label: "students online", value: 312, accent: "from-indigo-600 to-violet-600" },
      { label: "flashcards today", value: 12480, accent: "from-fuchsia-600 to-pink-600" },
      { label: "lessons completed", value: 2381, accent: "from-emerald-600 to-lime-600" },
    ],
    []
  );
  const [stats, setStats] = useState(base);

  useEffect(() => {
    let raf: number;
    let t0 = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(1, (t - t0) / 1200);
      setStats((prev) => prev.map((s, i) => ({ ...s, value: Math.round((base[i].value + i * 7) * (1 + 0.02 * dt)) })));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [base]);

  return (
    <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur-sm shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className={`text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r ${s.accent}`}>{s.value.toLocaleString()}</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

