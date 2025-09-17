"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import ShimmerHeading from "@/components/ui/ShimmerHeading";

type TimelineEvent = {
  id: string;
  year: string;
  title: string;
  body: string;
  align: "left" | "right";
  x: number; // percentage within SVG width
  y: number; // percentage within SVG height
};

const EVENTS: TimelineEvent[] = [
  {
    id: "2019",
    year: "2019",
    title: "EMS 1.0 launches",
    body: "Opened the first free IMAT forum with 30k words of guides and a dream to help anyone get into medical school in Italy.",
    align: "left",
    x: 6,
    y: 78,
  },
  {
    id: "2020",
    year: "2020",
    title: "Free prep library",
    body: "Published the full question bank, flashcards and the first iteration of the open-source biology & chemistry books.",
    align: "right",
    x: 23,
    y: 63,
  },
  {
    id: "2021",
    year: "2021",
    title: "Community milestones",
    body: "10,000 students joined EMS Discord. Introduced live study rooms, weekly sprint planning and mentor office hours.",
    align: "left",
    x: 40,
    y: 52,
  },
  {
    id: "2022",
    year: "2022",
    title: "Scholarships & clinics",
    body: "Launched the paid course to reinvest into free content, funded the first EMS scholarship cohort and started monthly strategy clinics.",
    align: "right",
    x: 57,
    y: 40,
  },
  {
    id: "2023",
    year: "2023",
    title: "Learning graph",
    body: "Built the adaptive learning graph, automated diagnostics and progress trackers so every student could see their next best step.",
    align: "left",
    x: 73,
    y: 31,
  },
  {
    id: "2024",
    year: "2024",
    title: "Global map & cohorts",
    body: "Released the interactive university map, cohort dashboards and the upgraded mobile learning experience.",
    align: "right",
    x: 86,
    y: 21,
  },
  {
    id: "2026",
    year: "2026",
    title: "The next chapter",
    body: "Preparing a full medical journey platform: admissions, courseware, clinical prep and a global support network built with students.",
    align: "left",
    x: 94,
    y: 11,
  },
];

const PATH_D = "M 20 360 C 160 315 260 270 320 210 C 390 150 470 110 560 80 C 640 55 720 40 800 30";

export default function ProgressTimeline() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const cards = useMemo(() => EVENTS, []);

  return (
    <section ref={containerRef} className="journey" aria-labelledby="journey-heading">
      <div className="journey-shell">
        <div className="journey-copy">
          <span className="kicker">Our Journey</span>
          <ShimmerHeading title="From 2019 to the next chapter" pretitle="Built with students, for students" size="md" variant="electric" />
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
          <svg className={`path ${visible ? "path-visible" : ""}`} viewBox="0 0 820 380" role="presentation" aria-hidden>
            <defs>
              <linearGradient id="journey-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="45%" stopColor="#22D3EE" />
                <stop offset="85%" stopColor="#f97316" />
              </linearGradient>
              <radialGradient id="journey-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(99,102,241,0.45)" />
                <stop offset="100%" stopColor="rgba(99,102,241,0)" />
              </radialGradient>
            </defs>
            <path d={PATH_D} className="line" />
            <path d={PATH_D} className="glow" />
          </svg>

          {cards.map((item, idx) => {
            const style = {
              left: `${item.x}%`,
              top: `${item.y}%`,
            } as React.CSSProperties;
            const delay = idx * 0.08;
            return (
              <motion.article
                key={item.id}
                className={`node node-${item.align}`}
                style={style}
                initial={{ opacity: 0, y: 12 }}
                animate={visible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay }}
              >
                <div className="dot" aria-hidden>
                  <span />
                </div>
                <div className="card">
                  <div className="year">{item.year}</div>
                  <div className="title">{item.title}</div>
                  <p>{item.body}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      <div className="journey-mobile" aria-hidden>
        <div className="progress-column">
          <div className="line" />
          {cards.map((item, idx) => (
            <motion.div
              key={`mobile-${item.id}`}
              className="mobile-card"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <div className="marker" />
              <div className="content">
                <div className="year">{item.year}</div>
                <div className="title">{item.title}</div>
                <p>{item.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .journey { position: relative; }
        .journey-shell { position: relative; border-radius: 36px; padding: clamp(24px, 5vw, 48px); background: linear-gradient(135deg, rgba(79,70,229,0.12), rgba(6,182,212,0.10)); box-shadow: 0 22px 60px rgba(15,23,42,0.16); overflow: hidden; display: grid; gap: clamp(24px, 4vw, 40px); grid-template-columns: minmax(0, 420px) minmax(0, 1fr); }
        .journey::before { content:""; position:absolute; inset:-20%; background:radial-gradient(680px 420px at 12% 18%, rgba(99,102,241,0.25), transparent), radial-gradient(680px 420px at 86% 78%, rgba(6,182,212,0.18), transparent); filter:blur(0.6px); opacity:0.8; z-index:-1; }
        .journey-copy { color: #0f172a; display: grid; gap: 14px; align-content: start; }
        .kicker { font-size: 12px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(49,46,129,0.7); }
        .lead { font-size: 15px; line-height: 1.65; color: rgba(15,23,42,0.85); }
        .quick { display: grid; gap: 8px; padding: 0; margin: 0; list-style: none; color: rgba(15,23,42,0.85); font-weight: 600; font-size: 14px; }
        .quick li { position: relative; padding-left: 18px; }
        .quick li::before { content:""; position:absolute; left:0; top:6px; width:8px; height:8px; border-radius:9999px; background: linear-gradient(135deg,#6366f1,#22d3ee); box-shadow: 0 6px 14px rgba(99,102,241,0.25); }

        .journey-visual { position: relative; min-height: 360px; }
        .journey-visual .path { width: 100%; height: 100%; }
        svg.path { position: absolute; inset: 0; }
        .line { fill: none; stroke: rgba(148,163,184,0.6); stroke-width: 6; stroke-linecap: round; stroke-dasharray: 1200; stroke-dashoffset: 1200; transition: stroke-dashoffset 2s cubic-bezier(0.22, 1, 0.36, 1); }
        .path-visible .line { stroke-dashoffset: 0; stroke: url(#journey-stroke); }
        .glow { fill: none; stroke: url(#journey-glow); stroke-width: 16; opacity: 0; transition: opacity 1.4s ease; }
        .path-visible .glow { opacity: 0.6; }

        .node { position: absolute; transform: translate(-50%, -50%); display: grid; gap: 10px; pointer-events: none; max-width: 240px; }
        .node .dot { width: 16px; height: 16px; border-radius: 9999px; background: linear-gradient(135deg,#6366f1,#22d3ee); box-shadow: 0 10px 24px rgba(79,70,229,0.35); display: grid; place-items: center; }
        .node .dot span { width: 6px; height: 6px; background: white; border-radius: 9999px; }
        .node .card { pointer-events: auto; border-radius: 20px; background: rgba(255,255,255,0.94); border: 1px solid rgba(148,163,184,0.25); box-shadow: 0 18px 44px rgba(15,23,42,0.16); padding: 16px; backdrop-filter: blur(8px); }
        .node .card .year { font-size: 12px; font-weight: 800; color: rgba(79,70,229,0.85); letter-spacing: 0.06em; text-transform: uppercase; }
        .node .card .title { margin-top: 4px; font-weight: 900; font-size: 16px; color: #0f172a; }
        .node .card p { margin-top: 6px; color: rgba(15,23,42,0.78); font-size: 13px; line-height: 1.55; }
        .node-right .card { transform-origin: left center; }
        .node-left .card { transform-origin: right center; }
        .node-right { text-align: left; }
        .node-left { text-align: right; }
        .node-left .card { margin-right: 14px; }
        .node-right .card { margin-left: 14px; }

        .journey-mobile { display: none; margin-top: 20px; }
        .progress-column { position: relative; padding-left: 22px; }
        .progress-column .line { position: absolute; left: 10px; top: 6px; bottom: 6px; width: 2px; background: linear-gradient(180deg,#6366f1,#22d3ee); opacity: .6; }
        .mobile-card { position: relative; display: grid; grid-template-columns: 22px 1fr; gap: 12px; margin-bottom: 20px; }
        .mobile-card:last-child { margin-bottom: 0; }
        .mobile-card .marker { width: 12px; height: 12px; border-radius: 9999px; background: linear-gradient(135deg,#6366f1,#22d3ee); box-shadow: 0 8px 18px rgba(79,70,229,0.25); align-self: center; }
        .mobile-card .content { border-radius: 20px; background: rgba(255,255,255,0.95); border: 1px solid rgba(148,163,184,0.25); padding: 14px; box-shadow: 0 16px 36px rgba(15,23,42,0.12); }
        .mobile-card .content .year { font-size: 12px; font-weight: 800; color: rgba(79,70,229,0.85); letter-spacing: .06em; text-transform: uppercase; }
        .mobile-card .content .title { margin-top: 4px; font-size: 16px; font-weight: 900; color: #0f172a; }
        .mobile-card .content p { margin-top: 6px; font-size: 13px; line-height: 1.6; color: rgba(15,23,42,0.78); }

        @media (max-width: 1024px) {
          .journey-shell { grid-template-columns: 1fr; }
          .journey-copy { order: 2; }
          .journey-visual { order: 1; min-height: 300px; }
          .journey-visual svg.path { inset: 6% 0 6% 0; }
          .node { max-width: 200px; }
        }

        @media (max-width: 860px) {
          .journey-shell { display: none; }
          .journey-mobile { display: block; border-radius: 28px; padding: 24px 18px; background: linear-gradient(135deg, rgba(79,70,229,0.12), rgba(6,182,212,0.10)); box-shadow: 0 20px 48px rgba(15,23,42,0.15); }
        }
      `}</style>
    </section>
  );
}
