"use client";

import { useRef, useState } from "react";
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

const ROW_VARIANTS = {
  hidden: { opacity: 0, y: 36 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.18 + index * 0.08,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function ProgressTimeline() {
  const headingId = "journey-heading";
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(timelineRef, { once: true, margin: "-25% 0px" });
  const [activeId, setActiveId] = useState(EVENTS[EVENTS.length - 1].id);

  const handleActivate = (id: string) => setActiveId(id);

  return (
    <section className="journey" aria-labelledby={headingId}>
      <div className="journey-shell">
        <div className="journey-copy">
          <span id={headingId} className="sr-only">
            Our journey — Built with students, for students. From 2019 to the next chapter.
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
            <motion.div
              className="axis"
              initial={{ scaleY: 0 }}
              animate={inView ? { scaleY: 1 } : {}}
              transition={{ duration: 1.6, ease: [0.18, 0.92, 0.25, 1] }}
            />
            <motion.div
              className="axis-glow"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 0.8 } : { opacity: 0 }}
              transition={{ delay: 0.25, duration: 1.2, ease: "easeOut" }}
            />

            <div className="timeline-events">
              {EVENTS.map((event, index) => (
                <motion.div
                  key={event.id}
                  className={clsx("row", `row-${event.align}`, {
                    "row-active": activeId === event.id,
                  })}
                  variants={ROW_VARIANTS}
                  initial="hidden"
                  animate={inView ? "visible" : "hidden"}
                  custom={index}
                >
                  <motion.button
                    type="button"
                    className={clsx("timeline-card", `card-${event.align}`, {
                      active: activeId === event.id,
                    })}
                    onPointerEnter={() => handleActivate(event.id)}
                    onFocus={() => handleActivate(event.id)}
                    onClick={() => handleActivate(event.id)}
                    aria-current={activeId === event.id ? "step" : undefined}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    <span className="timeline-year">{event.year}</span>
                    <span className="timeline-title">{event.title}</span>
                    <span className="timeline-body">{event.body}</span>
                  </motion.button>
                  <span className="timeline-marker" aria-hidden />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .journey {
          padding: clamp(40px, 8vw, 100px) 0;
          position: relative;
        }

        .journey-shell {
          position: relative;
          margin: 0 auto;
          width: min(1180px, calc(100vw - clamp(32px, 8vw, 120px)));
          border-radius: clamp(32px, 4vw, 48px);
          padding: clamp(28px, 6vw, 56px);
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.18), rgba(6, 182, 212, 0.14));
          box-shadow: 0 28px 90px rgba(15, 23, 42, 0.18);
          overflow: hidden;
          display: grid;
          gap: clamp(32px, 6vw, 72px);
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
          color: #0f172a;
        }

        .journey-shell::before {
          content: "";
          position: absolute;
          inset: -12% -18% -10% -18%;
          background:
            radial-gradient(600px 360px at 16% 22%, rgba(99, 102, 241, 0.32), transparent 72%),
            radial-gradient(520px 320px at 84% 80%, rgba(6, 182, 212, 0.26), transparent 70%);
          opacity: 0.92;
          z-index: 0;
        }

        .journey-copy,
        .journey-timeline {
          position: relative;
          z-index: 1;
        }

        .journey-copy {
          display: grid;
          gap: clamp(18px, 3.2vw, 30px);
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
          color: rgba(15, 23, 42, 0.88);
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
          padding: clamp(6px, 1.5vw, 16px) 0;
        }

        .timeline-events {
          position: relative;
          display: grid;
          gap: clamp(30px, 5vw, 54px);
          --connector-length: clamp(38px, 7vw, 82px);
          --axis-x: 50%;
          --axis-translate: -50%;
          z-index: 1;
        }

        .row {
          position: relative;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          column-gap: clamp(36px, 7vw, 120px);
          align-items: center;
        }

        .row-left .timeline-card {
          grid-column: 1;
          justify-self: end;
          text-align: right;
        }

        .row-right .timeline-card {
          grid-column: 2;
          justify-self: start;
          text-align: left;
        }

        .timeline-card {
          width: min(320px, 100%);
          border-radius: 24px;
          padding: clamp(18px, 3vw, 24px);
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(148, 163, 184, 0.28);
          box-shadow: 0 20px 48px rgba(15, 23, 42, 0.18);
          display: grid;
          gap: 8px;
          color: inherit;
          transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease, color 0.25s ease;
          position: relative;
          cursor: pointer;
          border: 0;
          text-align: inherit;
        }

        .timeline-card:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.45), 0 24px 56px rgba(15, 23, 42, 0.26);
        }

        .timeline-card.active,
        .timeline-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 26px 60px rgba(15, 23, 42, 0.24);
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

        .timeline-marker {
          position: absolute;
          top: 50%;
          left: var(--axis-x);
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          transform: translateX(var(--axis-translate)) translateY(-50%);
          background: linear-gradient(135deg, #6366f1, #22d3ee);
          box-shadow: 0 14px 36px rgba(79, 70, 229, 0.35);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          z-index: 2;
        }

        .timeline-marker::after {
          content: "";
          position: absolute;
          inset: 4px;
          border-radius: inherit;
          background: #fff;
        }

        .timeline-marker::before {
          content: "";
          position: absolute;
          top: 50%;
          height: 2px;
          background: linear-gradient(90deg, #6366f1, #22d3ee);
          opacity: 0.7;
          transform: translateY(-50%);
        }

        .row-left .timeline-marker::before {
          right: 100%;
          width: var(--connector-length);
        }

        .row-right .timeline-marker::before {
          left: 100%;
          width: var(--connector-length);
          background: linear-gradient(90deg, #22d3ee, #6366f1);
        }

        .row-active .timeline-card {
          background: rgba(15, 23, 42, 0.94);
          color: rgba(248, 250, 252, 0.96);
          box-shadow: 0 32px 72px rgba(15, 23, 42, 0.42);
        }

        .row-active .timeline-year {
          color: rgba(165, 180, 252, 0.92);
        }

        .row-active .timeline-body {
          color: rgba(226, 232, 240, 0.84);
        }

        .row-active .timeline-marker {
          box-shadow: 0 22px 50px rgba(79, 70, 229, 0.5);
        }

        .axis,
        .axis-glow {
          position: absolute;
          top: 0;
          bottom: 0;
          left: var(--axis-x);
          transform: translateX(var(--axis-translate));
          border-radius: 9999px;
          pointer-events: none;
          z-index: 0;
        }

        .axis {
          width: 4px;
          background: linear-gradient(180deg, #6366f1 0%, #22d3ee 45%, #f97316 100%);
          transform-origin: top center;
        }

        .axis-glow {
          width: 160px;
          margin-left: -80px;
          background: radial-gradient(120px 420px at 50% 50%, rgba(99, 102, 241, 0.22), transparent 68%);
          opacity: 0;
        }

        @media (max-width: 1180px) {
          .journey-shell {
            width: min(1120px, calc(100vw - clamp(32px, 6vw, 96px)));
          }
        }

        @media (max-width: 1024px) {
          .journey-shell {
            grid-template-columns: 1fr;
            gap: clamp(28px, 6vw, 52px);
          }

          .journey-copy {
            max-width: none;
          }
        }

        @media (max-width: 900px) {
          .journey {
            padding: clamp(28px, 9vw, 64px) 0;
          }

          .journey-shell {
            padding: clamp(22px, 7vw, 38px);
            border-radius: 32px;
          }

          .timeline {
            padding: 0;
          }

          .timeline-events {
            --axis-x: clamp(22px, 10vw, 34px);
            --connector-length: clamp(20px, 8vw, 34px);
          }

          .row {
            grid-template-columns: 1fr;
            row-gap: 14px;
            column-gap: 0;
            padding-left: calc(var(--axis-x) + var(--connector-length) + 20px);
          }

          .row-left .timeline-card,
          .row-right .timeline-card {
            grid-column: 1;
            justify-self: stretch;
            text-align: left;
          }

          .timeline-card {
            width: 100%;
          }

          .timeline-marker::before {
            display: none;
          }
        }

        @media (max-width: 600px) {
          .quick {
            gap: 8px;
            font-size: 13px;
          }

          .timeline-title {
            font-size: 16px;
          }

          .timeline-body {
            font-size: 12.5px;
          }
        }
      `}</style>
    </section>
  );
}
