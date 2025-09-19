"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import clsx from "clsx";
import ShimmerHeading from "@/components/ui/ShimmerHeading";

type TimelineEvent = {
  id: string;
  year: string;
  title: string;
  body: string;
};

const EVENTS: TimelineEvent[] = [
  {
    id: "2019",
    year: "2019",
    title: "EMS 1.0 launches",
    body: "Opened the first free IMAT forum with 30k words of guides and a dream to help anyone get into medical school in Italy.",
  },
  {
    id: "2020",
    year: "2020",
    title: "Free prep library",
    body: "Published the full question bank, flashcards and the first iteration of the open-source biology & chemistry books.",
  },
  {
    id: "2021",
    year: "2021",
    title: "Community milestones",
    body: "10,000 students joined EMS Discord. Introduced live study rooms, weekly sprint planning and mentor office hours.",
  },
  {
    id: "2022",
    year: "2022",
    title: "Scholarships & clinics",
    body: "Launched the paid course to reinvest into free content, funded the first EMS scholarship cohort and started monthly strategy clinics.",
  },
  {
    id: "2023",
    year: "2023",
    title: "Learning graph",
    body: "Built the adaptive learning graph, automated diagnostics and progress trackers so every student could see their next best step.",
  },
  {
    id: "2024",
    year: "2024",
    title: "Global map & cohorts",
    body: "Released the interactive university map, cohort dashboards and the upgraded mobile learning experience.",
  },
  {
    id: "2026",
    year: "2026",
    title: "The next chapter",
    body: "Preparing a full medical journey platform: admissions, courseware, clinical prep and a global support network built with students.",
  },
];

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 40 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.18 + index * 0.1,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const DOT_VARIANTS = {
  hidden: { scale: 0.4, opacity: 0 },
  visible: (index: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay: 0.28 + index * 0.1,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function ProgressTimeline() {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(timelineRef, { once: true, margin: "-20% 0px" });

  return (
    <section className="journey" aria-labelledby="journey-heading">
      <div className="journey-shell">
        <header className="journey-header">
          <span id="journey-heading" className="sr-only">
            From 2019 to the next chapter
          </span>
          <span className="kicker">Our Journey</span>
          <ShimmerHeading
            title="From 2019 to the next chapter"
            pretitle="Built with students, for students"
            size="md"
            variant="electric"
            align="center"
          />
          <p className="lead">
            EnterMedSchool started as a volunteer side project and grew into a global learning platform. Here are the moments that shaped the experience you see today.
          </p>
          <ul className="quick" role="list">
            <li>Independent, student-led product design since day one.</li>
            <li>Every launch reinvested into free, open resources.</li>
            <li>Community-first: mentorship, clinics and scholarships.</li>
          </ul>
        </header>

        <div className={clsx("timeline-wrapper", { "in-view": inView })} ref={timelineRef}>
          <motion.span
            className="timeline-axis"
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.span
            className="timeline-axis-glow"
            initial={{ opacity: 0, scaleY: 0.7 }}
            animate={inView ? { opacity: 0.75, scaleY: 1 } : { opacity: 0 }}
            transition={{ delay: 0.2, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />

          <ol className="timeline-track">
            {EVENTS.map((event, index) => (
              <motion.li
                key={event.id}
                className="timeline-item"
                variants={ITEM_VARIANTS}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                custom={index}
              >
                <motion.span
                  className="timeline-dot"
                  variants={DOT_VARIANTS}
                  initial="hidden"
                  animate={inView ? "visible" : "hidden"}
                  custom={index}
                  aria-hidden
                >
                  <span className="dot-year">{event.year}</span>
                </motion.span>
                <article className="timeline-card">
                  <h3>{event.title}</h3>
                  <p>{event.body}</p>
                </article>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>

      <style jsx>{`
        .journey {
          padding: clamp(48px, 10vw, 128px) 0;
          position: relative;
        }

        .journey-shell {
          width: min(1120px, calc(100vw - clamp(32px, 8vw, 140px)));
          margin: 0 auto;
          border-radius: clamp(36px, 6vw, 60px);
          padding: clamp(36px, 7vw, 70px) clamp(30px, 7vw, 56px);
          background: linear-gradient(145deg, rgba(248, 250, 252, 0.92), rgba(219, 234, 254, 0.88));
          box-shadow: 0 40px 120px rgba(15, 23, 42, 0.16);
          position: relative;
          overflow: hidden;
          display: grid;
          gap: clamp(40px, 7vw, 72px);
        }

        .journey-shell::before {
          content: "";
          position: absolute;
          inset: -45% -20% auto -30%;
          height: clamp(320px, 50vw, 520px);
          background: radial-gradient(420px 420px at 20% 40%, rgba(99, 102, 241, 0.22), transparent 70%);
          opacity: 0.8;
          pointer-events: none;
        }

        .journey-shell::after {
          content: "";
          position: absolute;
          inset: auto -30% -60% 20%;
          height: clamp(280px, 46vw, 460px);
          background: radial-gradient(360px 360px at 50% 50%, rgba(59, 130, 246, 0.2), transparent 70%);
          opacity: 0.7;
          pointer-events: none;
        }

        .journey-header {
          text-align: center;
          display: grid;
          gap: clamp(18px, 4vw, 28px);
          position: relative;
          z-index: 1;
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
          color: rgba(49, 46, 129, 0.68);
        }

        .lead {
          font-size: clamp(15px, 2.6vw, 17px);
          line-height: 1.65;
          color: rgba(15, 23, 42, 0.78);
          max-width: clamp(420px, 52vw, 520px);
          margin: 0 auto;
        }

        .quick {
          display: flex;
          flex-wrap: wrap;
          gap: 12px 24px;
          justify-content: center;
          padding: 0;
          margin: 0;
          list-style: none;
          color: rgba(15, 23, 42, 0.88);
          font-size: 14px;
          font-weight: 600;
        }

        .quick li {
          position: relative;
          padding-left: 18px;
        }

        .quick li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 6px;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: linear-gradient(135deg, #6366f1, #22d3ee);
          box-shadow: 0 6px 14px rgba(99, 102, 241, 0.28);
        }

        .timeline-wrapper {
          position: relative;
          padding: clamp(20px, 4vw, 30px) clamp(10px, 4vw, 20px);
        }

        .timeline-axis,
        .timeline-axis-glow {
          position: absolute;
          top: clamp(32px, 6vw, 44px);
          bottom: clamp(32px, 6vw, 44px);
          left: clamp(100px, 18vw, 180px);
          transform-origin: top center;
          border-radius: 9999px;
          pointer-events: none;
          z-index: 0;
        }

        .timeline-axis {
          width: 2px;
          background: linear-gradient(180deg, rgba(99, 102, 241, 0.5), rgba(14, 165, 233, 0.4));
        }

        .timeline-axis-glow {
          width: clamp(120px, 18vw, 220px);
          margin-left: calc(clamp(120px, 18vw, 220px) / -2 + 1px);
          background: radial-gradient(120px 380px at 50% 50%, rgba(99, 102, 241, 0.24), transparent 70%);
          opacity: 0;
        }

        .timeline-track {
          position: relative;
          z-index: 1;
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: clamp(28px, 6vw, 48px);
        }

        .timeline-item {
          display: grid;
          grid-template-columns: clamp(140px, 24vw, 220px) minmax(0, 1fr);
          align-items: center;
          column-gap: clamp(18px, 5vw, 40px);
          position: relative;
        }

        .timeline-item::after {
          content: "";
          position: absolute;
          left: clamp(100px, 18vw, 180px);
          top: 50%;
          width: clamp(40px, 12vw, 120px);
          border-top: 2px dotted rgba(99, 102, 241, 0.35);
          transform: translateY(-50%);
        }

        .timeline-item:last-child::after {
          display: none;
        }

        .timeline-dot {
          width: clamp(82px, 12vw, 108px);
          height: clamp(82px, 12vw, 108px);
          border-radius: 9999px;
          border: 2px dashed rgba(99, 102, 241, 0.5);
          display: grid;
          place-items: center;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.86), rgba(219, 234, 254, 0.6));
          box-shadow: 0 20px 48px rgba(15, 23, 42, 0.12);
          position: relative;
        }

        .timeline-dot::after {
          content: "";
          position: absolute;
          inset: 14px;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.14), rgba(14, 165, 233, 0.16));
          filter: blur(0.2px);
        }

        .dot-year {
          position: relative;
          z-index: 1;
          font-size: clamp(16px, 3.4vw, 20px);
          font-weight: 800;
          letter-spacing: 0.08em;
          color: rgba(55, 48, 163, 0.9);
        }

        .timeline-card {
          border-radius: clamp(24px, 5vw, 32px);
          padding: clamp(22px, 4.5vw, 32px);
          background: rgba(255, 255, 255, 0.9);
          border: 1.5px dashed rgba(148, 163, 184, 0.45);
          box-shadow: 0 26px 70px rgba(15, 23, 42, 0.12);
          display: grid;
          gap: 10px;
          position: relative;
        }

        .timeline-card::before {
          content: "";
          position: absolute;
          inset: 12px;
          border-radius: inherit;
          border: 1.5px solid rgba(148, 163, 184, 0.18);
          pointer-events: none;
        }

        .timeline-card h3 {
          font-size: clamp(18px, 3.6vw, 22px);
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .timeline-card p {
          margin: 0;
          font-size: clamp(14px, 3vw, 15px);
          line-height: 1.65;
          color: rgba(30, 41, 59, 0.78);
        }

        @media (max-width: 900px) {
          .journey-shell {
            width: min(720px, calc(100vw - clamp(24px, 6vw, 80px)));
          }

          .timeline-axis,
          .timeline-axis-glow {
            left: clamp(24px, 12vw, 42px);
          }

          .timeline-item {
            grid-template-columns: minmax(0, 1fr);
            row-gap: clamp(12px, 3vw, 18px);
            padding-left: clamp(58px, 18vw, 74px);
          }

          .timeline-item::after {
            left: clamp(24px, 12vw, 42px);
            width: clamp(18px, 10vw, 38px);
          }

          .timeline-dot {
            width: clamp(68px, 18vw, 86px);
            height: clamp(68px, 18vw, 86px);
            position: absolute;
            left: clamp(24px, 12vw, 42px);
            transform: translateX(-50%);
          }

          .timeline-card {
            padding: clamp(20px, 6vw, 26px);
          }
        }

        @media (max-width: 600px) {
          .journey {
            padding: clamp(34px, 14vw, 60px) 0;
          }

          .journey-shell {
            padding: clamp(26px, 10vw, 36px);
            border-radius: 32px;
            gap: clamp(32px, 10vw, 48px);
          }

          .quick {
            gap: 10px 16px;
            font-size: 13px;
          }

          .timeline-card {
            gap: 8px;
          }
        }
      `}</style>
    </section>
  );
}
