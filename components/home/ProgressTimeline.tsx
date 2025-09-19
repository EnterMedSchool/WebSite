"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import clsx from "clsx";
import ShimmerHeading from "@/components/ui/ShimmerHeading";

type TimelineEvent = {
  id: string;
  year: string;
  title: string;
  body: string;
  align: "left" | "right";
};

type MotionContext = {
  index: number;
  align: "left" | "right";
};

const EVENTS: TimelineEvent[] = [
  {
    id: "2019",
    year: "2019",
    title: "EMS 1.0 launches",
    body: "Opened the first free IMAT forum with 30k words of guides and a dream to help anyone get into medical school in Italy.",
    align: "left",
  },
  {
    id: "2020",
    year: "2020",
    title: "Free prep library",
    body: "Published the full question bank, flashcards and the first iteration of the open-source biology & chemistry books.",
    align: "right",
  },
  {
    id: "2021",
    year: "2021",
    title: "Community milestones",
    body: "10,000 students joined EMS Discord. Introduced live study rooms, weekly sprint planning and mentor office hours.",
    align: "left",
  },
  {
    id: "2022",
    year: "2022",
    title: "Scholarships & clinics",
    body: "Launched the paid course to reinvest into free content, funded the first EMS scholarship cohort and started monthly strategy clinics.",
    align: "right",
  },
  {
    id: "2023",
    year: "2023",
    title: "Learning graph",
    body: "Built the adaptive learning graph, automated diagnostics and progress trackers so every student could see their next best step.",
    align: "left",
  },
  {
    id: "2024",
    year: "2024",
    title: "Global map & cohorts",
    body: "Released the interactive university map, cohort dashboards and the upgraded mobile learning experience.",
    align: "right",
  },
  {
    id: "2026",
    year: "2026",
    title: "The next chapter",
    body: "Preparing a full medical journey platform: admissions, courseware, clinical prep and a global support network built with students.",
    align: "left",
  },
];

const CARD_VARIANTS = {
  hidden: (context: MotionContext) => ({
    opacity: 0,
    y: 36,
    x: context.align === "left" ? -38 : 38,
  }),
  visible: (context: MotionContext) => ({
    opacity: 1,
    y: 0,
    x: 0,
    transition: {
      delay: 0.28 + context.index * 0.12,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const MARKER_VARIANTS = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: (context: MotionContext) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.42 + context.index * 0.12,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function ProgressTimeline() {
  const headingId = "journey-heading";
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(timelineRef, { once: true, margin: "-25% 0px" });
  const [activeIndex, setActiveIndex] = useState(EVENTS.length - 1);

  const pauseRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setActive = (index: number) => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
    pauseRef.current = true;
    setActiveIndex(index);
  };

  const resumeAuto = () => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      pauseRef.current = false;
      resumeTimeoutRef.current = null;
    }, 1100);
  };

  useEffect(() => {
    if (!inView) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (!pauseRef.current) {
        setActiveIndex((prev) => (prev + 1) % EVENTS.length);
      }
    }, 5200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [inView]);

  useEffect(() => () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
  }, []);

  return (
    <section className="journey" aria-labelledby={headingId}>
      <div className="journey-shell">
        <div className="journey-copy">
          <span id={headingId} className="sr-only">
            Our journey - Built with students, for students. From 2019 to the next chapter.
          </span>
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

        <div className="journey-timeline">
          <div className="timeline" ref={timelineRef}>
            <motion.span
              className="axis"
              initial={{ scaleY: 0 }}
              animate={inView ? { scaleY: 1 } : {}}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.span
              className="axis-glow"
              initial={{ opacity: 0, scaleY: 0.6 }}
              animate={inView ? { opacity: 0.75, scaleY: 1 } : { opacity: 0 }}
              transition={{ delay: 0.25, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            />

            <ul className="timeline-events">
              {EVENTS.map((event, index) => {
                const active = index === activeIndex;
                const context: MotionContext = { index, align: event.align };
                return (
                  <li
                    key={event.id}
                    className={clsx("event", `event-${event.align}`, { active })}
                  >
                    <motion.button
                      type="button"
                      className={clsx("event-card", { active })}
                      variants={CARD_VARIANTS}
                      initial="hidden"
                      animate={inView ? "visible" : "hidden"}
                      custom={context}
                      aria-current={active ? "step" : undefined}
                      onPointerEnter={() => setActive(index)}
                      onPointerLeave={resumeAuto}
                      onFocus={() => setActive(index)}
                      onBlur={() => {
                        pauseRef.current = false;
                      }}
                      onClick={() => setActive(index)}
                      whileHover={{ y: -6 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 240, damping: 22 }}
                    >
                      <span className="timeline-year">{event.year}</span>
                      <span className="timeline-title">{event.title}</span>
                      <span className="timeline-body">{event.body}</span>
                    </motion.button>

                    <motion.span
                      className="event-marker"
                      variants={MARKER_VARIANTS}
                      initial="hidden"
                      animate={inView ? "visible" : "hidden"}
                      custom={context}
                      aria-hidden
                    >
                      <span className="marker-core" />
                    </motion.span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .journey {
          padding: clamp(48px, 9vw, 120px) 0;
          position: relative;
        }

        .journey-shell {
          position: relative;
          margin: 0 auto;
          width: min(1180px, calc(100vw - clamp(32px, 8vw, 140px)));
          border-radius: clamp(32px, 5vw, 58px);
          padding: clamp(34px, 6vw, 64px);
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.22), rgba(6, 182, 212, 0.14));
          box-shadow: 0 36px 110px rgba(15, 23, 42, 0.18);
          display: grid;
          gap: clamp(36px, 6vw, 80px);
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
          color: #0f172a;
          overflow: hidden;
        }

        .journey-shell::before {
          content: "";
          position: absolute;
          inset: -18% -22% -16% -20%;
          background:
            radial-gradient(640px 380px at 18% 22%, rgba(99, 102, 241, 0.35), transparent 72%),
            radial-gradient(560px 340px at 82% 82%, rgba(6, 182, 212, 0.28), transparent 70%),
            radial-gradient(420px 260px at 50% 10%, rgba(14, 165, 233, 0.22), transparent 70%);
          opacity: 0.95;
          z-index: 0;
        }

        .journey-shell::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(380px 180px at 70% 0%, rgba(255, 255, 255, 0.22), transparent 72%);
          opacity: 0.6;
          z-index: 0;
        }

        .journey-copy,
        .journey-timeline {
          position: relative;
          z-index: 1;
        }

        .journey-copy {
          display: grid;
          gap: clamp(20px, 3.5vw, 32px);
          align-content: start;
          max-width: 420px;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .kicker {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(49, 46, 129, 0.75);
        }

        .lead {
          font-size: 15px;
          line-height: 1.7;
          color: rgba(15, 23, 42, 0.85);
        }

        .quick {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          color: rgba(15, 23, 42, 0.9);
        }

        .quick li {
          position: relative;
          padding-left: 20px;
        }

        .quick li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 7px;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: linear-gradient(135deg, #6366f1, #22d3ee);
          box-shadow: 0 6px 14px rgba(99, 102, 241, 0.28);
        }

        .journey-timeline {
          position: relative;
        }

        .timeline {
          position: relative;
          padding: clamp(8px, 2vw, 30px) 0;
          --glow-width: clamp(190px, 24vw, 280px);
        }

        .timeline-events {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: clamp(42px, 6.8vw, 90px);
          position: relative;
          z-index: 1;
          --axis-column-width: clamp(86px, 10vw, 118px);
          --column-gap: clamp(28px, 6vw, 72px);
          --connector-run: calc(var(--column-gap) + var(--axis-column-width) / 2);
        }

        .event {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr) var(--axis-column-width) minmax(0, 1fr);
          column-gap: var(--column-gap);
          align-items: center;
        }

        .event-card {
          width: min(360px, 100%);
          border-radius: 26px;
          padding: clamp(20px, 3vw, 26px);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(148, 163, 184, 0.24);
          box-shadow: 0 26px 72px rgba(15, 23, 42, 0.22);
          display: grid;
          gap: 8px;
          color: inherit;
          transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease, color 0.25s ease;
          position: relative;
          text-align: left;
          cursor: pointer;
          border: 0;
        }

        .event-left .event-card {
          grid-column: 1;
          justify-self: end;
          text-align: right;
        }

        .event-right .event-card {
          grid-column: 3;
          justify-self: start;
        }

        .event-card:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.45), 0 26px 62px rgba(15, 23, 42, 0.28);
        }

        .event-card::after {
          content: "";
          position: absolute;
          top: 50%;
          width: var(--connector-run);
          height: 2px;
          transform: translateY(-50%);
          opacity: 0.55;
          background: linear-gradient(90deg, #6366f1, #22d3ee);
          pointer-events: none;
        }

        .event-left .event-card::after {
          right: calc(var(--connector-run) * -1);
        }

        .event-right .event-card::after {
          left: calc(var(--connector-run) * -1);
          background: linear-gradient(90deg, #22d3ee, #6366f1);
        }

        .timeline-year {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(79, 70, 229, 0.9);
        }

        .timeline-title {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.35;
        }

        .timeline-body {
          font-size: 13px;
          line-height: 1.6;
          color: rgba(15, 23, 42, 0.78);
        }

        .event-marker {
          grid-column: 2;
          justify-self: center;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          position: relative;
          display: grid;
          place-items: center;
        }

        .event-marker::before {
          content: "";
          position: absolute;
          inset: -20px;
          border-radius: inherit;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.32), transparent 70%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .event-marker::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(135deg, #6366f1, #22d3ee);
          box-shadow: 0 16px 36px rgba(79, 70, 229, 0.35);
        }

        .marker-core {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #fff;
          z-index: 1;
        }

        .axis,
        .axis-glow {
          position: absolute;
          top: clamp(-120px, -12vw, -80px);
          bottom: clamp(-120px, -12vw, -80px);
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
          border-radius: 9999px;
          z-index: 0;
        }

        .axis {
          width: 4px;
          background: linear-gradient(180deg, #6366f1 0%, #22d3ee 45%, #f97316 100%);
          transform-origin: top center;
          box-shadow: 0 0 24px rgba(79, 70, 229, 0.45);
        }

        .axis-glow {
          width: var(--glow-width);
          margin-left: calc(var(--glow-width) / -2);
          background: radial-gradient(160px 440px at 50% 38%, rgba(99, 102, 241, 0.28), transparent 72%);
          filter: blur(0.6px);
          opacity: 0;
        }

        .event.active .event-card {
          background: rgba(15, 23, 42, 0.94);
          color: rgba(248, 250, 252, 0.96);
          box-shadow: 0 38px 92px rgba(15, 23, 42, 0.46);
        }

        .event.active .event-card::after {
          opacity: 0.9;
        }

        .event.active .timeline-year {
          color: rgba(165, 180, 252, 0.92);
        }

        .event.active .timeline-body {
          color: rgba(226, 232, 240, 0.86);
        }

        .event.active .event-marker::before {
          opacity: 1;
          animation: markerPulse 2.4s ease-out infinite;
        }

        .event-card:hover:not(.active) {
          transform: translateY(-6px);
          box-shadow: 0 28px 64px rgba(15, 23, 42, 0.26);
        }

        @keyframes markerPulse {
          0% {
            transform: scale(0.5);
            opacity: 0.6;
          }
          60% {
            transform: scale(1.05);
            opacity: 0.12;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        @media (max-width: 1180px) {
          .journey-shell {
            width: min(1100px, calc(100vw - clamp(30px, 6vw, 100px)));
          }
        }

        @media (max-width: 1024px) {
          .journey-shell {
            grid-template-columns: 1fr;
            gap: clamp(30px, 6vw, 58px);
          }

          .journey-copy {
            max-width: none;
          }
        }

        @media (max-width: 900px) {
          .timeline {
            --glow-width: clamp(160px, 58vw, 220px);
          }

          .timeline-events {
            --axis-column-width: 0px;
            --column-gap: 0px;
            --connector-run: 0px;
            gap: clamp(26px, 8vw, 36px);
          }

          .event {
            grid-template-columns: 1fr;
            row-gap: clamp(12px, 4vw, 18px);
            padding-left: clamp(54px, 18vw, 70px);
          }

          .event-card,
          .event-left .event-card,
          .event-right .event-card {
            justify-self: stretch;
            text-align: left;
          }

          .event-card::after {
            display: none;
          }

          .event-marker {
            position: absolute;
            left: clamp(26px, 12vw, 34px);
            top: 50%;
            transform: translate(-50%, -50%);
          }

          .axis,
          .axis-glow {
            left: clamp(26px, 12vw, 34px);
          }
        }

        @media (max-width: 600px) {
          .journey {
            padding: clamp(32px, 12vw, 60px) 0;
          }

          .journey-shell {
            padding: clamp(24px, 9vw, 36px);
            border-radius: 36px;
          }

          .timeline-title {
            font-size: 16px;
          }

          .timeline-body {
            font-size: 12.5px;
          }

          .quick {
            gap: 8px;
            font-size: 13px;
          }
        }
      `}</style>
    </section>
  );
}
