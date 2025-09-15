"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ShimmerHeading from "@/components/ui/ShimmerHeading";

type Cue = {
  start: number;
  end: number;
  title: string;
  body?: string;
  bullets?: string[];
  color?: "indigo" | "violet" | "sky" | "emerald" | "fuchsia";
};

const CUES: Cue[] = [
  { start: 0, end: 4, title: "Explore with clarity", body: "Map-first discovery with live data.", bullets: ["Live seats", "Score trends"], color: "indigo" },
  { start: 4, end: 10, title: "Hear real voices", body: "Unfiltered student reviews.", bullets: ["Campus life", "Teaching quality"], color: "emerald" },
  { start: 10, end: 18, title: "Prepare together", body: "Mini-lessons, flashcards and practice.", bullets: ["Learn", "Practice", "Review"], color: "violet" },
  { start: 18, end: 28, title: "Make confident decisions", body: "Compare schools side-by-side.", bullets: ["Pros/cons", "All in one"], color: "sky" },
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
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const cueIndex = useMemo(() => timeToCueIndex(time), [time]);
  const cue = CUES[cueIndex];
  const progress = useMemo(() => {
    const span = Math.max(0.001, cue.end - cue.start);
    return Math.min(100, Math.max(0, ((time - cue.start) / span) * 100));
  }, [time, cue]);

  // Play / pause on intersection
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setTime(v.currentTime);
    v.addEventListener("timeupdate", onTime);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        });
      },
      { threshold: 0.35 }
    );
    if (containerRef.current) io.observe(containerRef.current);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      io.disconnect();
    };
  }, []);

  // Tiny celebratory bursts when cue changes
  const [burstKey, setBurstKey] = useState(0);
  const [bursts, setBursts] = useState<Array<{ id: number; left: number; top: number; color: string }>>([]);
  useEffect(() => {
    const palette = ["#22d3ee", "#60a5fa", "#a78bfa", "#34d399", "#fb7185", "#f59e0b"];
    const items = Array.from({ length: 8 }).map((_, i) => ({
      id: burstKey + i,
      left: 55 + Math.random() * 40, // right half near video
      top: 10 + Math.random() * 70,
      color: palette[i % palette.length],
    }));
    setBursts(items);
    const t = setTimeout(() => setBursts([]), 1100);
    setBurstKey((k) => k + 8);
    return () => clearTimeout(t);
  }, [cueIndex]);

  // Theme palette by cue
  const theme = useMemo(() => {
    switch (cue.color) {
      case "emerald":
        return { a: "#10b981", b: "#14b8a6" };
      case "violet":
        return { a: "#a78bfa", b: "#f472b6" };
      case "sky":
        return { a: "#60a5fa", b: "#22d3ee" };
      default:
        return { a: "#6366f1", b: "#22d3ee" };
    }
  }, [cue.color]);

  function jumpTo(index: number) {
    const v = videoRef.current; if (!v) return; const c = CUES[index];
    v.currentTime = c.start + 0.02; v.play().catch(() => {}); setPlaying(true);
  }

  return (
    <div ref={containerRef} className="ms-root" style={{ ["--a" as any]: theme.a, ["--b" as any]: theme.b } as any}>
      <div className="ms-topbar" />
      <div className="ms-tint" aria-hidden />
      <div className="ms-grid">
        {/* Copy */}
        <div className="ms-copy">
          <ShimmerHeading pretitle="Our Mission" title={"EnterMedSchool"} variant="indigo" size="md" />
          <p className="ms-lead">A vibrant home for choosing, preparing and thriving in medical school.</p>

          <AnimatePresence mode="wait">
            <motion.div key={`cue-${cueIndex}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
              <div className="ms-cue-title">{cue.title}</div>
              {cue.body && <div className="ms-cue-body">{cue.body}</div>}
              {cue.bullets && (
                <ul className="ms-bullets" role="list">
                  {cue.bullets.map((b, i) => (
                    <li key={i}><span className={`dot d${(i % 3) + 1}`} />{b}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="ms-cta">
            <button className="btn-primary" onClick={() => window.dispatchEvent(new CustomEvent("auth:open"))}>Create account</button>
            <a href="#universities" className="btn-ghost">Explore map</a>
          </div>

          {/* Stepper */}
          <div className="ms-steps" role="tablist" aria-label="Mission steps">
            {CUES.map((c, i) => (
              <button key={i} role="tab" aria-selected={cueIndex===i} className={`step ${cueIndex===i? 'active':''}`} onClick={() => jumpTo(i)}>
                {i===0?'Explore':i===1?'Reviews':i===2?'Prepare':'Decide'}
              </button>
            ))}
          </div>
        </div>

        {/* Video */}
        <div className="ms-video-wrap">
          <div className="ms-progress">
            <div className="bar" style={{ width: `${progress}%` }} />
          </div>
          <div className="ms-video-glow" aria-hidden />
          <video
            ref={videoRef}
            src={videoSrc}
            poster={poster}
            className="ms-video"
            playsInline
            muted={muted}
            preload="none"
            loop={false}
            controls={false}
          />
          <div className="ms-caption"><span>{cue.title}</span></div>
          {/* Controls */}
          <div className="ms-controls">
            <button
              className="ctrl"
              aria-label="Toggle play"
              onClick={() => {
                const v = videoRef.current; if (!v) return; if (v.paused) v.play().catch(() => {}); else v.pause();
                setPlaying(!playing);
              }}
            >
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <button
              className="ctrl"
              aria-label="Toggle mute"
              onClick={() => { setMuted((m) => !m); const v = videoRef.current; if (v) { v.muted = !muted; if (v.paused) v.play().catch(() => {}); } }}
            >
              {muted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5l-5 4H4v6h3l5 4zM16.5 12a4.5 4.5 0 0 0-2.2-3.9v7.8a4.5 4.5 0 0 0 2.2-3.9z" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5l-5 4H4v6h3l5 4zM19 5l-2 2 2 2 2-2-2-2zm0 10l-2 2 2 2 2-2-2-2z" /></svg>
              )}
            </button>
          </div>

          {/* Cue bursts */}
          <div className="ms-bursts" aria-hidden>
            {bursts.map((b) => (
              <span key={b.id} className="p" style={{ left: `${b.left}%`, top: `${b.top}%`, background: b.color }} />
            ))}
          </div>
        </div>
      </div>

      {/* Scoped styles */}
      <style jsx>{`
        .ms-root { position: relative; overflow: hidden; border-radius: 24px; padding: 18px; color: white; background: linear-gradient(135deg, var(--a, #4f46e5) 0%, #7c3aed 45%, var(--b, #06b6d4) 100%); box-shadow: 0 20px 54px rgba(49,46,129,.36); }
        .ms-topbar { height: 10px; border-radius: 9999px; background: linear-gradient(90deg, rgba(255,255,255,.65), rgba(255,255,255,.0), rgba(255,255,255,.65)); opacity: .35; animation: sweep 12s linear infinite; background-size: 200% 100%; }
        @keyframes sweep { 0% { background-position: 0% 50% } 100% { background-position: 200% 50% } }
        .ms-tint { position:absolute; inset:-10% -10% -10% -10%; z-index:0; pointer-events:none; background:
          radial-gradient(900px 280px at 16% 28%, color-mix(in oklab, var(--a, #6366f1) 45%, white 0%), transparent 60%),
          radial-gradient(1000px 360px at 88% 72%, color-mix(in oklab, var(--b, #22d3ee) 45%, white 0%), transparent 66%);
          animation: tintFloat 18s ease-in-out infinite alternate; filter:saturate(120%);
        }
        @keyframes tintFloat { from { transform: translateY(0) } to { transform: translateY(12px) } }
        .ms-grid { display: grid; gap: 20px; align-items: center; grid-template-columns: 1fr; }
        @media (min-width: 1024px) { .ms-grid { grid-template-columns: 6fr 6fr; } }
        .ms-copy { padding: 8px 8px 12px; }
        .ms-lead { margin-top: 6px; opacity: .9; }
        .ms-cue-title { margin-top: 12px; font-size: 20px; font-weight: 900; letter-spacing: .01em; }
        .ms-cue-body { margin-top: 4px; opacity: .9; }
        .ms-bullets { margin-top: 8px; display: grid; gap: 6px; }
        .ms-bullets li { display: flex; align-items: center; gap: 10px; font-weight: 700; }
        .dot { width: 10px; height: 10px; border-radius: 9999px; display: inline-block; }
        .dot.d1 { background: linear-gradient(135deg,#60a5fa,#22d3ee); box-shadow: 0 6px 16px rgba(96,165,250,.35); }
        .dot.d2 { background: linear-gradient(135deg,#a78bfa,#f472b6); box-shadow: 0 6px 16px rgba(167,139,250,.35); }
        .dot.d3 { background: linear-gradient(135deg,#34d399,#10b981); box-shadow: 0 6px 16px rgba(16,185,129,.35); }
        .ms-cta { margin-top: 14px; display: flex; gap: 10px; flex-wrap: wrap; }
        .btn-primary { background: white; color: #3730a3; font-weight: 800; border-radius: 9999px; padding: 8px 14px; box-shadow: 0 10px 24px rgba(255,255,255,.25); }
        .btn-ghost { border: 1px solid rgba(255,255,255,.55); color: white; font-weight: 800; border-radius: 9999px; padding: 8px 14px; }
        .ms-steps { margin-top: 10px; display: inline-flex; gap: 6px; padding: 4px; border-radius: 9999px; background: rgba(255,255,255,.18); backdrop-filter: blur(3px); }
        .step { appearance:none; border:0; cursor:pointer; padding:6px 12px; border-radius:9999px; font-weight:900; color:white; opacity:.85; }
        .step.active { background:white; color:#1f2937; box-shadow:0 8px 18px rgba(255,255,255,.35); }

        .ms-video-wrap { position: relative; padding: 12px; }
        .ms-progress { height: 6px; border-radius: 9999px; background: rgba(255,255,255,.28); margin-bottom: 8px; overflow: hidden; }
        .ms-progress .bar { height: 100%; border-radius: 9999px; background: linear-gradient(90deg,#22d3ee,#60a5fa); transition: width .6s cubic-bezier(.22,1,.36,1); }
        .ms-video-glow { position: absolute; inset: -12px -20px -20px -12px; z-index: -1; filter: blur(30px); opacity: .7; background: radial-gradient(260px 80px at 30% 10%, rgba(255,255,255,.45), transparent), radial-gradient(360px 100px at 70% 90%, rgba(255,255,255,.25), transparent); }
        .ms-video { width: min(520px, 100%); aspect-ratio: 9/16; border-radius: 28px; background: #000; object-fit: cover; box-shadow: 0 18px 44px rgba(2,6,23,.25), 0 0 0 1px rgba(255,255,255,.22) inset; }
        .ms-caption { position:absolute; left: 24px; bottom: 26px; background: linear-gradient(90deg, var(--a,#6366f1), var(--b,#22d3ee)); color:white; font-weight:900; border-radius:9999px; padding:8px 12px; box-shadow:0 10px 26px rgba(2,6,23,.24); }
        .ms-controls { position: absolute; top: 14px; right: 14px; display: flex; gap: 8px; }
        .ctrl { background: rgba(0,0,0,.45); color: white; border: 0; border-radius: 9999px; width: 34px; height: 34px; display: grid; place-items: center; backdrop-filter: blur(4px); }
        .ms-bursts { position: absolute; inset: 0; pointer-events: none; }
        .p { position: absolute; width: 10px; height: 10px; border-radius: 9999px; opacity: .0; transform: scale(.4); animation: pop 1.1s ease forwards; box-shadow: 0 8px 18px rgba(0,0,0,.15); }
        @keyframes pop { 10% { opacity: .95; transform: scale(1) } 100% { opacity: 0; transform: translateY(-18px) scale(.75) } }
      `}</style>
    </div>
  );
}
