"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function LearnAbout() {
  const src = "https://entermedschool.b-cdn.net/wp-content/uploads/2024/05/Vidinsta_Instagram-Post_6634e8cf0c8eb.mp4";
  const poster = "https://entermedschool.b-cdn.net/wp-content/uploads/2024/05/Untitled-design.png";
  const vRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);

  function togglePlay() {
    const v = vRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  }

  // Autoplay muted when in viewport; pause when out
  useEffect(() => {
    const v = vRef.current;
    if (!v) return;
    v.muted = true;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          v.play().then(()=> setPlaying(true)).catch(()=>{});
        } else {
          v.pause(); setPlaying(false);
        }
      });
    }, { threshold: 0.5 });
    obs.observe(v);
    return () => { obs.disconnect(); };
  }, []);

  return (
    <section className="my-12">
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-5 sm:p-7 text-white shadow-[0_18px_44px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Decorative particles & soft glows */}
        <motion.div
          className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating dots */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-10 top-12 h-2 w-2 rounded-full bg-white/60 animate-twinkle"></div>
          <div className="absolute left-24 top-32 h-1.5 w-1.5 rounded-full bg-white/60 animate-float-slow"></div>
          <div className="absolute right-16 top-16 h-2 w-2 rounded-full bg-white/50 animate-twinkle" style={{animationDelay:'0.6s'}}></div>
          <div className="absolute right-32 bottom-8 h-1.5 w-1.5 rounded-full bg-white/50 animate-float-slow" style={{animationDelay:'1.2s'}}></div>
        </div>

        {/* Layout: video on the right, copy + steps on the left (stacks on mobile) */}
        <div className="relative grid items-center gap-6 lg:grid-cols-12">
          {/* Left: copy + steps */}
          <div className="lg:col-span-6">
            <motion.h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl" initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}>
              What is EnterMedSchool?
            </motion.h2>
            <p className="mt-2 text-sm text-indigo-100/90">
              A live, map‑first way to discover medical schools in Europe — with real seat numbers, historical admission
              scores, and trends you can compare at a glance.
            </p>

            {/* How it works: compact three‑step in the same card */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { title: "Explore", href: "#universities", items: ["Check seats & scores", "Compare on the live map" ] },
                { title: "Study", href: "#lessons", items: ["Free mini‑lessons", "Practice questions" ] },
                { title: "Socialize", href: "/#communities", items: ["Communities & forums", "Virtual libraries" ] },
              ].map((s, i) => (
                <motion.a
                  key={s.title}
                  href={s.href}
                  className="block rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 hover:bg-white/15"
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 200, damping: 18 }}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20 text-xs">{i + 1}</span>
                    {s.title}
                  </div>
                  <ul className="mt-2 space-y-1 pl-8 text-xs text-indigo-100/90">
                    {s.items.map((li) => (<li key={li} className="list-disc">{li}</li>))}
                  </ul>
                </motion.a>
              ))}
            </div>

            <motion.a href="#universities" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              Start Exploring
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M5 12h12M13 6l6 6-6 6"/></svg>
            </motion.a>
          </div>

          {/* Right: portrait video */}
          <div className="lg:col-span-6">
            <motion.div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-2xl ring-1 ring-white/30 shadow-2xl"
              whileHover={{ rotate: -0.5, scale: 1.01 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video ref={vRef} src={`${src}#t=0.1`} poster={poster} className="h-full w-full object-cover" playsInline preload="metadata" />

              {!playing && (
                <button onClick={togglePlay} className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-indigo-700 shadow-xl" aria-label="Play intro">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M8 5v14l11-7z"/></svg>
                </button>
              )}
              {playing && (
                <button onClick={togglePlay} className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/60" aria-label="Pause">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                </button>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
