"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import ShimmerHeading from "@/components/ui/ShimmerHeading";

type TimelineEvent = {
  id: string;
  year: string;
  title: string;
  body: string;
  align: "left" | "right";
  progress: number; // 0..1 along the path
};

const VIEWBOX_WIDTH = 820;
const VIEWBOX_HEIGHT = 380;
const PATH_D = "M 24 350 C 140 320 260 260 330 190 C 410 110 520 70 620 46 C 700 26 780 18 800 12";

const RAW_EVENTS: TimelineEvent[] = [
  {
    id: "2019",
    year: "2019",
    title: "EMS 1.0 launches",
    body: "Opened the first free IMAT forum with 30k words of guides and a dream to help anyone get into medical school in Italy.",
    align: "left",
    progress: 0.05,
  },
  {
    id: "2020",
    year: "2020",
    title: "Free prep library",
    body: "Published the full question bank, flashcards and the first iteration of the open-source biology & chemistry books.",
    align: "right",
    progress: 0.2,
  },
  {
    id: "2021",
    year: "2021",
    title: "Community milestones",
    body: "10,000 students joined EMS Discord. Introduced live study rooms, weekly sprint planning and mentor office hours.",
    align: "left",
    progress: 0.36,
  },
  {
    id: "2022",
    year: "2022",
    title: "Scholarships & clinics",
    body: "Launched the paid course to reinvest into free content, funded the first EMS scholarship cohort and started monthly strategy clinics.",
    align: "right",
    progress: 0.53,
  },
  {
    id: "2023",
    year: "2023",
    title: "Learning graph",
    body: "Built the adaptive learning graph, automated diagnostics and progress trackers so every student could see their next best step.",
    align: "left",
    progress: 0.72,
  },
  {
    id: "2024",
    year: "2024",
    title: "Global map & cohorts",
    body: "Released the interactive university map, cohort dashboards and the upgraded mobile learning experience.",
    align: "right",
    progress: 0.86,
  },
  {
    id: "2026",
    year: "2026",
    title: "The next chapter",
    body: "Preparing a full medical journey platform: admissions, courseware, clinical prep and a global support network built with students.",
    align: "left",
    progress: 0.97,
  },
];

type PositionedEvent = TimelineEvent & { x: number; y: number };

export default function ProgressTimeline() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string>(RAW_EVENTS[RAW_EVENTS.length - 1].id);
  const [positions, setPositions] = useState<PositionedEvent[]>(() =>
    RAW_EVENTS.map((event) => ({ ...event, x: 0, y: 0 }))
  );

  const recompute = useCallback(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    const next = RAW_EVENTS.map((event) => {
      const distance = Math.max(0, Math.min(length, event.progress * length));
      const point = path.getPointAtLength(distance);
      return {
        ...event,
        x: (point.x / VIEWBOX_WIDTH) * 100,
        y: (point.y / VIEWBOX_HEIGHT) * 100,
      };
    });
    setPositions(next);
  }, []);

  useEffect(() => {
    recompute();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", recompute, { passive: true });
      return () => window.removeEventListener("resize", recompute);
    }
    return undefined;
  }, [recompute]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const mobileEvents = useMemo(() => positions, [positions]);

  return (
    <section ref={containerRef} className="journey" aria-labelledby="journey-heading">
      <div className="journey-shell">
        <div className="journey-copy">
          <span className="kicker">Our Journey</span>
          <ShimmerHeading
            title="From 2019 to the next chapter"
            pretitle="Built with students, for students"
            size="md"
            variant="electric"
          />
          <p className="lead">
            EnterMedSchool started as a volunteer side project and grew into a global learning platform. Here are the moments that shaped the experience you see today.
          </p>
          <ul className="quick" role="list">
            <li>Independent, student-led product design since day one.</li>
            <li>Every launch reinvested into free, open resources.</li>
            <li>Community-first: mentorship, clinics and scholarships.</li>
          </ul>
        </div>

        <div className="journey-visual">
          <svg
            className={`timeline ${visible ? "timeline-visible" : ""}`}
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            role="presentation"
            aria-hidden
          >
            <defs>
              <linearGradient id="timeline-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="45%" stopColor="#22D3EE" />
                <stop offset="90%" stopColor="#F97316" />
              </linearGradient>
              <radialGradient id="timeline-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(99,102,241,0.45)" />
                <stop offset="100%" stopColor="rgba(99,102,241,0)" />
              </radialGradient>
            </defs>
            <path ref={pathRef} d={PATH_D} className="line" />
            <path d={PATH_D} className="glow" />
          </svg>

          {positions.map((event, index) => {
            const delay = index * 0.08;
            return (
              <motion.button
                key={event.id}
                type="button"
                className={`node node-${event.align} ${active === event.id ? "active" : ""}`}
                style={{ left: `${event.x}%`, top: `${event.y}%` }}
                onMouseEnter={() => setActive(event.id)}
                onFocus={() => setActive(event.id)}
                onMouseLeave={() => setActive(RAW_EVENTS[RAW_EVENTS.length - 1].id)}
                onBlur={() => setActive(RAW_EVENTS[RAW_EVENTS.length - 1].id)}
                initial={{ opacity: 0, y: 12 }}
                animate={visible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay }}
              >
                <span className="dot" aria-hidden />
                <span className="card">
                  <span className="year">{event.year}</span>
                  <span className="title">{event.title}</span>
                  <span className="body">{event.body}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="journey-mobile">
        <div className="progress-column">
          <span className="rail" aria-hidden />
          {mobileEvents.map((event, idx) => (
            <motion.div
              key={`mobile-${event.id}`}
              className="mobile-card"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <span className="marker" aria-hidden />
              <span className="content">
                <span className="year">{event.year}</span>
                <span className="title">{event.title}</span>
                <p>{event.body}</p>
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx>{`
        \.journey { padding: clamp(20px, 4vw, 36px) 0; overflow: hidden; }
        .journey-shell { position: relative; max-width: 1120px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 380px) minmax(0, 1fr); gap: clamp(24px, 5vw, 48px); border-radius: 36px; padding: clamp(24px, 5vw, 48px); background: linear-gradient(135deg, rgba(79,70,229,0.14), rgba(6,182,212,0.12)); box-shadow: 0 28px 70px rgba(15,23,42,0.16); overflow: hidden; }
        .journey-shell::before { content:""; position:absolute; inset: -6% -10%; background: radial-gradient(620px 380px at 12% 18%, rgba(99,102,241,0.24), transparent), radial-gradient(600px 340px at 88% 78%, rgba(6,182,212,0.22), transparent); pointer-events:none; z-index:0; }
        .journey-shell > * { position: relative; z-index: 1; }
        .journey-copy { color: #0f172a; display: grid; gap: 16px; align-content: start; }
        .kicker { font-size: 12px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(49,46,129,0.75); }
        .lead { font-size: 15px; line-height: 1.65; color: rgba(15,23,42,0.85); max-width: 44ch; }
        .quick { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; font-size: 14px; font-weight: 600; color: rgba(15,23,42,0.85); }
        .quick li { position: relative; padding-left: 18px; }
        .quick li::before { content:""; position:absolute; left:0; top:6px; width:8px; height:8px; border-radius:9999px; background: linear-gradient(135deg,#6366f1,#22d3ee); box-shadow: 0 6px 14px rgba(99,102,241,0.25); }

        .journey-visual { position: relative; min-height: 360px; }
        .timeline { position: absolute; inset: 0; width: 100%; height: 100%; }
        .line { fill: none; stroke: rgba(148,163,184,0.4); stroke-width: 4.5; stroke-linecap: round; stroke-dasharray: 1100; stroke-dashoffset: 1100; transition: stroke-dashoffset 2.2s cubic-bezier(0.22, 1, 0.36, 1); }
        .timeline-visible .line { stroke-dashoffset: 0; stroke: url(#timeline-stroke); }
        .glow { fill: none; stroke: url(#timeline-glow); stroke-width: 14; opacity: 0; transition: opacity 1.4s ease 0.3s; }
        .timeline-visible .glow { opacity: 0.7; }

        .node { position: absolute; transform: translate(-50%, -50%); display: inline-grid; gap: 12px; align-items: center; text-align: left; background: none; border: 0; padding: 0; cursor: pointer; }
        .node:focus-visible { outline: none; box-shadow: 0 0 0 2px rgba(99,102,241,0.6); border-radius: 24px; }
        .node .dot { width: 16px; height: 16px; border-radius: 9999px; background: linear-gradient(135deg,#6366f1,#22d3ee); box-shadow: 0 10px 24px rgba(79,70,229,0.32); position: relative; }
        .node .dot::after { content:""; position:absolute; inset: 4px; border-radius:9999px; background:white; }
        .node.node-left { justify-items: end; }
        .node.node-right { justify-items: start; }
        .node.node-left .card { text-align: right; }
        .node.node-right .card { text-align: left; }
        .node .card { pointer-events: none; max-width: min(240px, 32vw); border-radius: 20px; background: rgba(255,255,255,0.92); border: 1px solid rgba(148,163,184,0.25); box-shadow: 0 18px 44px rgba(15,23,42,0.18); padding: 14px 16px; display: grid; gap: 6px; transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease; }
        .node .card .year { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(79,70,229,0.85); }
        .node .card .title { font-size: 15px; font-weight: 800; color: #0f172a; line-height: 1.3; }
        .node .card .body { font-size: 13px; line-height: 1.55; color: rgba(15,23,42,0.78); display: block; }
        .node.active .card { background: rgba(15,23,42,0.92); color: rgba(248,250,252,0.95); box-shadow: 0 24px 52px rgba(15,23,42,0.3); transform: translateY(-4px); }
        .node.active .card .year { color: rgba(129,140,248,0.9); }
        .node.active .card .body { color: rgba(226,232,240,0.86); }

        .journey-mobile { display: none; max-width: 560px; margin: clamp(16px,4vw,28px) auto 0; border-radius: 28px; padding: clamp(20px, 6vw, 32px) clamp(18px, 5vw, 28px); background: linear-gradient(135deg, rgba(79,70,229,0.14), rgba(6,182,212,0.12)); box-shadow: 0 24px 56px rgba(15,23,42,0.16); }
        .progress-column { position: relative; }
        .progress-column .rail { position: absolute; left: 12px; top: 0; bottom: 0; width: 2px; background: linear-gradient(180deg,#6366f1,#22d3ee); opacity: 0.6; }
        .mobile-card { position: relative; display: grid; grid-template-columns: 26px 1fr; gap: 14px; margin-bottom: 20px; }
        .mobile-card:last-of-type { margin-bottom: 0; }
        .mobile-card .marker { width: 12px; height: 12px; border-radius: 9999px; background: linear-gradient(135deg,#6366f1,#22d3ee); box-shadow: 0 10px 24px rgba(79,70,229,0.32); align-self: center; }
        .mobile-card .content { border-radius: 20px; background: rgba(255,255,255,0.94); border: 1px solid rgba(148,163,184,0.25); padding: 14px; box-shadow: 0 18px 44px rgba(15,23,42,0.18); display: grid; gap: 6px; }
        .mobile-card .content .year { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(79,70,229,0.85); }
        .mobile-card .content .title { font-size: 15px; font-weight: 800; color: #0f172a; }
        .mobile-card .content p { font-size: 13px; line-height: 1.55; color: rgba(15,23,42,0.78); margin: 0; }

        @media (max-width: 1080px) {
          .journey-shell { grid-template-columns: 1fr; }
          .journey-copy { max-width: 560px; }
          .journey-visual { min-height: 340px; }
        }

        @media (max-width: 880px) {
          .journey-shell { display: none; }
          .journey-mobile { display: block; }
        }
      `}</style>
    </section>
  );
}


