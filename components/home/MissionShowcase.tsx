"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Cue = {
  start: number;
  end: number;
  title: string;
  body?: string;
  bullets?: string[];
  color?: string; // tailwind text/bg accents
};

const CUES: Cue[] = [
  {
    start: 0,
    end: 3,
    title: "EnterMedSchool’s mission is to help you find the right medical school for you.",
    body: "A fast, data‑driven way to navigate options with clarity and confidence.",
    color: "indigo",
  },
  {
    start: 4,
    end: 8,
    title: "We do this in three simple steps.",
    bullets: ["Explore", "Read reviews", "Prepare & connect"],
    color: "violet",
  },
  {
    start: 8,
    end: 16,
    title: "First — explore our interactive map.",
    body: "Discover schools you can apply to, compare seats and historical scores.",
    bullets: ["Live seat counts", "Cutoff trends", "Side‑by‑side compare"],
    color: "sky",
  },
  {
    start: 17,
    end: 30,
    title: "Second — read honest, uncensored testimonials.",
    body: "Real students. Real experiences. Get the vibe before you apply.",
    bullets: ["Campus life", "Teaching quality", "Hidden trade‑offs"],
    color: "emerald",
  },
  {
    start: 30,
    end: 45,
    title: "Finally — connect, learn, and prepare.",
    body: "Join communities, follow the enrollment steps, and study with mini‑lessons & practice questions.",
    bullets: ["Communities & forums", "Enrollment checklist", "Mini‑lessons + practice"],
    color: "fuchsia",
  },
];

function timeToCueIndex(t: number) {
  const i = CUES.findIndex((c) => t >= c.start && t < c.end);
  return i === -1 ? 0 : i;
}

export default function MissionShowcase({
  videoSrc = "/ems-mission.mp4",
  poster,
}: {
  videoSrc?: string;
  poster?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [pool, setPool] = useState<any[]>([]);
  const [falling, setFalling] = useState<{ id: string; author: string; quote: string; uni: string; logo?: string; x: number }[]>([]);

  const cueIndex = useMemo(() => timeToCueIndex(time), [time]);
  const cue = CUES[cueIndex];
  const progress = useMemo(() => {
    const c = cue; const span = Math.max(0.001, c.end - c.start);
    return Math.min(100, Math.max(0, ((time - c.start) / span) * 100));
  }, [time, cue]);

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onTime = () => setTime(v.currentTime);
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, []);

  useEffect(() => {
    // Autoplay when visible
    const v = videoRef.current; if (!v) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { v.play().catch(()=>{}); setPlaying(true); }
        else { v.pause(); setPlaying(false); }
      });
    }, { threshold: 0.3 });
    if (containerRef.current) io.observe(containerRef.current);
    return () => io.disconnect();
  }, []);

  // Fetch random testimonials pool for falling cards
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/testimonials/random', { cache: 'no-store' });
        const j = await r.json();
        setPool(j?.testimonials || []);
      } catch {}
    })();
  }, []);

  // Spawn falling testimonial cards
  useEffect(() => {
    if (!pool.length) return;
    let timer: any;
    const spawn = () => {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      const x = Math.random() * 70 + 10; // 10%..80%
      setFalling((arr) => [
        ...arr,
        {
          id: `${pick.id}-${Date.now()}`,
          author: pick.author || 'Student',
          quote: pick.quote || '',
          uni: pick.university_title || 'University',
          logo: pick.logo_url || undefined,
          x,
        },
      ].slice(-10));
      timer = setTimeout(spawn, 1800 + Math.random() * 1200);
    };
    spawn();
    return () => clearTimeout(timer);
  }, [pool]);

  const jump = (idx: number) => {
    const v = videoRef.current; if (!v) return;
    v.currentTime = CUES[idx].start + 0.05; v.play().catch(()=>{}); setPlaying(true);
  };

  const colorFrom = (name?: string) => ({
    ring: name ? `ring-${name}-300/40` : "ring-white/20",
    glow: name ? `from-${name}-500/20` : "from-indigo-500/20",
    bar: name ? `from-${name}-400 to-${name}-300` : "from-indigo-400 to-indigo-300",
    dot: name ? `bg-${name}-500` : "bg-indigo-500",
  });
  const cx = colorFrom(cue.color);

  // Emphasis moments overlay
  const showMiniMap = time >= 8 && time < 11;
  const emphasize = showMiniMap ? null : (
    (time >= 1 && time < 2) ? { text: "Choose the RIGHT medical school FOR YOU", color: "from-amber-400 to-pink-400" } :
    (time >= 8 && time < 9) ? { text: "Use the interactive map above!", color: "from-sky-400 to-cyan-300" } :
    (time >= 18 && time < 20) ? { text: "Real student testimonials — no BS", color: "from-emerald-400 to-lime-300" } :
    (time >= 36 && time < 39) ? { text: "You did it! You’ve Entered Med School!", color: "from-fuchsia-400 to-violet-400", fireworks: true } :
    null
  );

  return (
    <div ref={containerRef} className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-[0_18px_50px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20">
      {/* floating stars */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-8 top-6 h-1 w-1 animate-twinkle rounded-full bg-white/70"/>
        <div className="absolute right-12 top-10 h-1 w-1 animate-twinkle rounded-full bg-white/70"/>
        <div className="absolute left-24 bottom-8 h-1 w-1 animate-twinkle rounded-full bg-white/60"/>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: dynamic text (fixed height to avoid layout jump) */}
        <div className="flex flex-col justify-center">
          <div className="text-3xl font-extrabold leading-tight sm:text-4xl">What is EnterMedSchool?</div>
          <div className="mt-2 text-white/85">A live, map‑first way to discover medical schools in Europe — with real seat numbers, historical admission scores, and trends you can compare at a glance.</div>

          {/* Cue content */}
          <div className={`mt-5 rounded-2xl border ${cx.ring} bg-white/10 p-4 backdrop-blur min-h-[200px]`}> 
            <AnimatePresence mode="wait">
              <motion.div
                key={cueIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <StepIcon index={cueIndex} />
                  <span>{cue.title}</span>
                </div>
                {cue.body && <div className="mt-1 text-sm text-white/85">{cue.body}</div>}
                {cue.bullets && (
                  <ul className="mt-3 grid gap-1 text-sm text-white/90">
                    {cue.bullets.map((b, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className={`inline-block h-2 w-2 rounded-full ${cx.dot}`} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Progress bar per cue */}
            <div className="mt-3 h-1.5 w-full rounded-full bg-white/15">
              <div className={`h-1.5 rounded-full bg-gradient-to-r ${cx.bar}`} style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Step dots + scrubber */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {CUES.map((c, i) => (
              <button
                key={i}
                onClick={() => jump(i)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${i === cueIndex ? "bg-white text-indigo-700" : "bg-white/15 text-white hover:bg-white/25"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-2 h-1.5 w-full max-w-sm rounded-full bg-white/15">
            <div className="relative h-1.5 rounded-full bg-white/20">
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white to-white/80" style={{ width: `${Math.min(100, (time / 45) * 100)}%` }} />
              <div className="absolute inset-0 flex justify-between text-white/70">
                {CUES.map((c, i) => (
                  <button key={i} onClick={() => jump(i)} className="-mt-[3px] h-2 w-2 rounded-full bg-white/60 hover:bg-white" style={{ transform: `translateX(-1px)` }} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <a href="#map" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow hover:bg-white/90">
              Start Exploring <span>→</span>
            </a>
          </div>
        </div>

        {/* Right: video */}
        <div className="relative">
          <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-3xl bg-black/40 ring-1 ring-white/20 sm:max-w-sm md:max-w-md">
            <video
              ref={videoRef}
              src={videoSrc}
              poster={poster}
              className="aspect-[9/16] w-full object-cover"
              playsInline
              muted={muted}
              autoPlay
              loop={false}
              controls={false}
            />
            {/* play/pause */}
            <button
              onClick={() => {
                const v = videoRef.current; if (!v) return;
                if (v.paused) { v.play().catch(()=>{}); setPlaying(true); } else { v.pause(); setPlaying(false); }
              }}
              className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/50"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            {/* mute/unmute (enables audio on tap) */}
            <button
              onClick={() => { setMuted((m)=>!m); const v=videoRef.current; if(v) { v.muted = !muted; if(v.paused) v.play().catch(()=>{}); } }}
              className="absolute left-3 top-3 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/50"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5l-5 4H4v6h3l5 4zM16.5 12a4.5 4.5 0 0 0-2.2-3.9v7.8a4.5 4.5 0 0 0 2.2-3.9z"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5l-5 4H4v6h3l5 4zM19 5l-2 2 2 2 2-2-2-2zm0 10l-2 2 2 2 2-2-2-2z"/></svg>
              )}
            </button>
          </div>
          {/* gentle glow */}
          <div className={`pointer-events-none absolute -inset-6 -z-10 bg-gradient-to-r ${cx.glow} to-transparent blur-2xl`} />
          {/* emphasis overlays & fireworks */}
          <AnimatePresence>
            {emphasize && (
              <motion.div
                className="pointer-events-none absolute inset-0 grid place-items-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
              >
                <div className={`rounded-full bg-gradient-to-r ${emphasize.color} px-4 py-1.5 text-sm font-extrabold text-indigo-900 shadow-lg`}>{emphasize.text}</div>
                {emphasize.fireworks && <Fireworks />}
              </motion.div>
            )}
          </AnimatePresence>
          {/* Mini map overlay (00:08–00:11) */}
          <AnimatePresence>
            {showMiniMap && (
              <motion.div
                className="pointer-events-none absolute inset-0 grid place-items-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <MiniMapOverlay />
              </motion.div>
            )}
          </AnimatePresence>
          {/* Confetti trail when celebrating */}
          <AnimatePresence>
            {emphasize?.fireworks && <ConfettiTrail />}
          </AnimatePresence>
          {/* Falling testimonials overlay */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <AnimatePresence>
              {falling.map((f) => (
                <motion.div
                  key={f.id}
                  initial={{ y: -60, x: `${f.x}%`, opacity: 0, rotate: -5 }}
                  animate={{ y: 520, opacity: 1, rotate: 8 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 6.5, ease: 'linear' }}
                  className="pointer-events-none w-[220px] -translate-x-1/2 rounded-xl border border-white/20 bg-white/95 p-3 text-indigo-900 shadow-xl backdrop-blur"
                  onAnimationComplete={() => setFalling((arr) => arr.filter((x) => x.id !== f.id))}
                  style={{ boxShadow: '0 12px 30px rgba(30,27,75,0.25)' }}
                >
                  <div className="flex items-center gap-2">
                    {f.logo ? <img src={f.logo} alt="logo" className="h-6 w-6 rounded" /> : <span className="h-6 w-6 rounded bg-indigo-200" />}
                    <div className="text-xs font-semibold line-clamp-1">{f.uni}</div>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-700 line-clamp-3">“{f.quote}”</div>
                  <div className="mt-1 text-[10px] text-gray-500">— {f.author}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepIcon({ index }: { index: number }) {
  const s = index;
  const base = "h-5 w-5";
  if (s === 0) return <svg viewBox="0 0 24 24" className={base} fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5v5h5v2h-7V7h2z"/></svg>;
  if (s === 1) return <svg viewBox="0 0 24 24" className={base} fill="currentColor"><path d="M3 5h18v2H3zM3 11h12v2H3zM3 17h8v2H3z"/></svg>;
  if (s === 2) return <svg viewBox="0 0 24 24" className={base} fill="currentColor"><path d="M12 2l4 8H8l4-8zm0 20a8 8 0 100-16 8 8 0 000 16z"/></svg>;
  if (s === 3) return <svg viewBox="0 0 24 24" className={base} fill="currentColor"><path d="M4 4h16v12H4zM2 18h20v2H2z"/></svg>;
  return <svg viewBox="0 0 24 24" className={base} fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L6.5 20l2-7L3 9h7z"/></svg>;
}

function Fireworks() {
  const sparks = Array.from({ length: 24 });
  return (
    <div className="pointer-events-none absolute inset-0">
      {sparks.map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-sm"
          style={{ left: "50%", top: "60%", background: ["#34d399", "#60a5fa", "#f472b6", "#fbbf24"][i % 4] }}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
          animate={{ opacity: 0, x: Math.cos((i / 24) * Math.PI * 2) * 140, y: Math.sin((i / 24) * Math.PI * 2) * 120, rotate: (i * 40) % 360 }}
          transition={{ duration: 1.1, ease: "easeOut", delay: (i % 6) * 0.02 }}
        />
      ))}
    </div>
  );
}

function ConfettiTrail() {
  const items = Array.from({ length: 100 });
  return (
    <div className="pointer-events-none absolute inset-0">
      {items.map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-1.5 w-2 rounded-sm"
          style={{ left: `${(i / items.length) * 100}%`, top: `${(Math.random() * 30) + 60}%`, background: ["#f59e0b", "#10b981", "#60a5fa", "#f472b6"][i % 4] }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -30 - Math.random() * 40, opacity: [0, 1, 0] }}
          transition={{ duration: 1.2 + Math.random() * 0.8, delay: (i % 20) * 0.03 }}
        />
      ))}
    </div>
  );
}

function MiniMapOverlay() {
  // Lightweight decorative "map" with pulsing pins and a label pointing up.
  // Pins roughly clustered where Italy sits on a simple Europe bbox (not geo-accurate — just for vibe).
  const pins = [
    { x: 56, y: 42, label: "Milan" },
    { x: 58, y: 46, label: "Pavia" },
    { x: 60, y: 44, label: "Bergamo" },
    { x: 62, y: 48, label: "Bologna" },
    { x: 63, y: 52, label: "Florence" },
    { x: 66, y: 56, label: "Siena" },
    { x: 66, y: 60, label: "Rome" },
    { x: 69, y: 63, label: "Naples" },
    { x: 73, y: 58, label: "Bari" },
    { x: 58, y: 55, label: "Parma" },
  ];
  return (
    <div className="pointer-events-none grid place-items-center">
      <div className="relative w-[480px] max-w-[86vw] rounded-3xl border border-white/25 bg-gradient-to-br from-indigo-500/40 to-violet-500/30 p-3 shadow-2xl backdrop-blur-md">
        {/* stylized map canvas */}
        <div className="relative h-[240px] w-full overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_60%),radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.08),transparent_55%)] ring-1 ring-white/20">
          {/* faint grid */}
          <svg viewBox="0 0 100 50" className="absolute inset-0 h-full w-full opacity-30">
            <defs>
              <pattern id="g" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="50" fill="url(#g)" />
          </svg>
          {/* pins */}
          {pins.map((p, i) => (
            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              <div className="relative">
                <div className="absolute -left-2 -top-2 h-7 w-7 animate-ping rounded-full bg-emerald-300/50" />
                <div className="relative h-3.5 w-3.5 rounded-full bg-emerald-400 ring-2 ring-white/70" />
              </div>
              <div className="mt-2 -ml-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 shadow">{p.label}</div>
            </div>
          ))}
          {/* label */}
          <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-indigo-700 shadow">
            Use the interactive map!
          </div>
          {/* arrow up */}
          <div className="absolute left-1/2 bottom-3 -translate-x-1/2 text-[10px] text-white/90">Want more? Check out the full map above ↑</div>
        </div>
      </div>
    </div>
  );
}
