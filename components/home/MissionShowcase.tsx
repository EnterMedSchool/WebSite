"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Cue = {
  start: number;
  end: number;
  title: string;
  body?: string;
  bullets?: string[];
  color?: "indigo" | "violet" | "sky" | "emerald" | "fuchsia";
};

const CUES: Cue[] = [
  {
    start: 0,
    end: 3,
    title:
      "EnterMedSchool's mission is to help you find the right medical school for you.",
    body:
      "A fast, data-driven way to navigate options with clarity and confidence.",
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
    title: "First - explore our interactive map.",
    body:
      "Discover schools you can apply to, compare seats and historical scores.",
    bullets: ["Live seat counts", "Cutoff trends", "Side-by-side compare"],
    color: "sky",
  },
  {
    start: 17,
    end: 30,
    title: "Second - read honest, uncensored testimonials.",
    body:
      "Real students. Real experiences. Get the vibe before you apply.",
    bullets: ["Campus life", "Teaching quality", "Hidden trade-offs"],
    color: "emerald",
  },
  {
    start: 30,
    end: 45,
    title: "Finally - connect, learn, and prepare.",
    body:
      "Join communities, follow the enrollment steps, and study with mini-lessons & practice questions.",
    bullets: ["Communities & forums", "Enrollment checklist", "Mini-lessons + practice"],
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
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [finished, setFinished] = useState(false);

  const cueIndex = useMemo(() => timeToCueIndex(time), [time]);
  const cue = CUES[cueIndex];
  const progress = useMemo(() => {
    const c = cue;
    const span = Math.max(0.001, c.end - c.start);
    return Math.min(100, Math.max(0, ((time - c.start) / span) * 100));
  }, [time, cue]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setTime(v.currentTime);
    const onEnded = () => setFinished(true);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            v.play().catch(() => {});
            setPlaying(true);
          } else {
            v.pause();
            setPlaying(false);
          }
        });
      },
      { threshold: 0.3 }
    );
    if (containerRef.current) io.observe(containerRef.current);
    return () => io.disconnect();
  }, []);

  function jump(i: number) {
    const v = videoRef.current;
    if (!v) return;
    const c = CUES[i];
    v.currentTime = c.start + 0.01;
    setFinished(false);
  }

  const colorFrom = (c?: Cue["color"]) => {
    if (c === "violet")
      return {
        ring: "ring-violet-300/30",
        dot: "bg-violet-300",
        bar: "from-violet-400 to-fuchsia-400",
        glow: "from-violet-400",
      };
    if (c === "sky")
      return {
        ring: "ring-sky-300/30",
        dot: "bg-sky-300",
        bar: "from-sky-400 to-cyan-400",
        glow: "from-sky-400",
      };
    if (c === "emerald")
      return {
        ring: "ring-emerald-300/30",
        dot: "bg-emerald-300",
        bar: "from-emerald-400 to-lime-400",
        glow: "from-emerald-400",
      };
    if (c === "fuchsia")
      return {
        ring: "ring-fuchsia-300/30",
        dot: "bg-fuchsia-300",
        bar: "from-fuchsia-400 to-violet-400",
        glow: "from-fuchsia-400",
      };
    return {
      ring: "ring-indigo-300/30",
      dot: "bg-indigo-300",
      bar: "from-indigo-400 to-violet-400",
      glow: "from-indigo-400",
    };
  };
  const cx = colorFrom(cue.color);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-[0_18px_50px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: dynamic text */}
        <div className="flex flex-col justify-center">
          <div className="text-3xl font-extrabold leading-tight sm:text-4xl">
            What is EnterMedSchool?
          </div>
          <div className="mt-2 text-white/85">
            A live, map-first way to discover medical schools in Europe — with
            real seat numbers, historical admission scores, and trends you can
            compare at a glance.
          </div>

          {/* Cue content */}
          <div
            className={`mt-5 rounded-2xl border ${cx.ring} bg-white/10 p-4 backdrop-blur min-h-[200px]`}
          >
            <AnimatePresence mode="wait">
              {!finished ? (
                <motion.div
                  key={`cue-${cueIndex}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <StepIcon index={cueIndex} />
                    <span>{cue.title}</span>
                  </div>
                  {cue.body && (
                    <div className="mt-1 text-sm text-white/85">{cue.body}</div>
                  )}
                  {cue.bullets && (
                    <ul className="mt-3 grid gap-1 text-sm text-white/90">
                      {cue.bullets.map((b, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${cx.dot}`}
                          />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="finished"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="text-2xl font-extrabold">
                    Congrats! Now you know how to EnterMedSchool.
                  </div>
                  <div className="mt-2 text-sm text-white/85">
                    How about we create your account?
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() =>
                        window.dispatchEvent(new CustomEvent("auth:open"))
                      }
                      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow hover:bg-white/90"
                    >
                      Create your account
                    </button>
                    <button
                      onClick={() => {
                        setFinished(false);
                        const v = videoRef.current;
                        if (v) {
                          v.currentTime = 0;
                          v.play().catch(() => {});
                          setPlaying(true);
                        }
                      }}
                      className="rounded-xl border border-white/50 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                    >
                      Back to video
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress bar per cue */}
            <div className="mt-3 h-1.5 w-full rounded-full bg-white/15">
              <div
                className={`h-1.5 rounded-full bg-gradient-to-r ${cx.bar}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step dots + scrubber */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {CUES.map((c, i) => (
              <button
                key={i}
                onClick={() => jump(i)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  i === cueIndex
                    ? "bg-white text-indigo-700"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-2 h-1.5 w-full max-w-sm rounded-full bg-white/15">
            <div className="relative h-1.5 rounded-full bg-white/20">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white to-white/80"
                style={{ width: `${Math.min(100, (time / 45) * 100)}%` }}
              />
              <div className="absolute inset-0 flex justify-between text-white/70">
                {CUES.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => jump(i)}
                    className="-mt-[3px] h-2 w-2 rounded-full bg-white/60 hover:bg-white"
                    style={{ transform: `translateX(-1px)` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("auth:open"))
              }
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow hover:bg-white/90"
            >
              Create an account
            </button>
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
              preload="none"
              loop={false}
              controls={false}
            />
            {/* play/pause */}
            <button
              onClick={() => {
                const v = videoRef.current;
                if (!v) return;
                if (v.paused) {
                  v.play().catch(() => {});
                  setPlaying(true);
                } else {
                  v.pause();
                  setPlaying(false);
                }
              }}
              className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/50"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            {/* mute/unmute (enables audio on tap) */}
            <button
              onClick={() => {
                setMuted((m) => !m);
                const v = videoRef.current;
                if (v) {
                  v.muted = !muted;
                  if (v.paused) v.play().catch(() => {});
                }
              }}
              className="absolute left-3 top-3 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/50"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5l-5 4H4v6h3l5 4zM16.5 12a4.5 4.5 0 0 0-2.2-3.9v7.8a4.5 4.5 0 0 0 2.2-3.9z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5l-5 4H4v6h3l5 4zM19 5l-2 2 2 2 2-2-2-2zm0 10l-2 2 2 2 2-2-2-2z" />
                </svg>
              )}
            </button>
          </div>
          {/* gentle glow */}
          <div
            className={`pointer-events-none absolute -inset-6 -z-10 bg-gradient-to-r ${cx.glow} to-transparent blur-2xl`}
          />
        </div>
      </div>
    </div>
  );
}

function StepIcon({ index }: { index: number }) {
  return (
    <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-[12px] font-extrabold text-indigo-700 shadow">
      {index + 1}
    </span>
  );
}

