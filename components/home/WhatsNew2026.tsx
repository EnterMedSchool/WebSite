"use client";
import React from "react";
import ShimmerHeading from "@/components/ui/ShimmerHeading";
import NewCourseSystem from "@/components/home/NewCourseSystem";
import CasesFeatureShowcase from "@/components/home/CasesFeatureShowcase";

export default function WhatsNew2026() {
  return (
    <section
      id="whats-new-2026"
      className="wn-section relative w-full py-10 sm:py-14 md:py-16 lg:left-1/2 lg:right-1/2 lg:-ml-[50vw] lg:-mr-[50vw] lg:w-screen"
      aria-labelledby="whats-new-2026-heading"
    >
      {/* Clear background: just text + animation, full width with inner buffer */}
      <div className="mx-auto w-full px-6 sm:px-10">
        <div className="relative text-center">
          {/* Accessible heading */}
          <h2 id="whats-new-2026-heading" className="sr-only">
            What is new on EnterMedSchool 2026
          </h2>

          {/* Animated headline */}
          <div className="select-none font-extrabold tracking-tight leading-[0.9]">
            <div className="mx-auto">
              <span className="block text-[clamp(28px,5vw,42px)] text-indigo-900/70">
                What is <span className="new-pill">NEW
                  <svg className="ml-1 h-[14px] w-[14px] text-white/95 drop-shadow" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 2l1.8 4.6L18 8.4l-4.2 1.7L12 15l-1.8-4.9L6 8.4l4.2-1.8L12 2z" />
                  </svg>
                </span> on
              </span>
              <div className="relative mt-4 sm:mt-6">
                <ShimmerHeading title="EnterMedSchool 2026" variant="indigo" size="xl" align="center" />

                {/* Soft glow behind text */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 blur-2xl hidden sm:block"
                  style={{
                    background:
                      "radial-gradient(60% 60% at 50% 50%, rgba(99,102,241,0.25), transparent 60%)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Animated underline */}
          <div className="mx-auto mt-6 w-full">
            <svg
              viewBox="0 0 1200 120"
              className="h-[28px] w-full"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <linearGradient id="wn2026-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="50%" stopColor="#A78BFA" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              <path
                d="M0,70 C200,20 400,120 600,70 C800,20 1000,120 1200,70"
                fill="none"
                stroke="url(#wn2026-stroke)"
                strokeWidth="10"
                strokeLinecap="round"
                className="dash-path"
              />
            </svg>
          </div>

          {/* Subtext / placeholder for important updates that will sit under this title */}
          <p className="mx-auto mt-4 text-sm sm:text-base text-indigo-900/70">
            Big updates are here. Explore the improvements and new features we
            built for the 2026 season.
          </p>
        </div>
      </div>

      {/* New Course System feature */}
      <div className="mx-auto max-w-6xl px-6 sm:px-10 mt-10">
        <NewCourseSystem />
      </div>

      <div className="mx-auto max-w-6xl px-6 sm:px-10 mt-14">
        <CasesFeatureShowcase />
      </div>

      {/* Component-scoped styles for underline + NEW pill + background */}
      <style jsx>{`
        .wn-section { position: relative; isolation: isolate; }
        .new-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 9999px;
          font-weight: 900;
          letter-spacing: 0.06em;
          color: white;
          text-transform: uppercase;
          position: relative;
          overflow: hidden;
          background-image: linear-gradient(90deg, #f59e0b, #fb7185, #a855f7);
          box-shadow: 0 8px 22px rgba(168, 85, 247, 0.25), 0 2px 8px rgba(255, 255, 255, 0.4) inset;
          filter: drop-shadow(0 6px 14px rgba(99, 102, 241, 0.18));
        }
        /* Glossy sweep */
        .new-pill::before {
          content: "";
          position: absolute;
          inset: -30% auto -30% -60%;
          width: 40%;
          transform: skewX(-20deg) translateX(0);
          background: linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.65) 45%, rgba(255,255,255,0) 80%);
          animation: wn2026-shine 2.75s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        /* Soft top gloss */
        .new-pill::after {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 45%;
          background: linear-gradient(to bottom, rgba(255,255,255,0.35), rgba(255,255,255,0));
          pointer-events: none;
        }
        @keyframes wn2026-shine {
          0% { transform: skewX(-20deg) translateX(-120%); }
          100% { transform: skewX(-20deg) translateX(260%); }
        }
        .dash-path {
          stroke-dasharray: 180 22;
          stroke-dashoffset: 0;
          animation: wn2026-dash 4.5s ease-in-out infinite;
          filter: drop-shadow(0px 6px 18px rgba(99, 102, 241, 0.25));
        }
        @keyframes wn2026-dash {
          0% { stroke-dashoffset: 0; }
          50% { stroke-dashoffset: 160; }
          100% { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dash-path { animation: none; }
        }
        @media (max-width: 768px) {
          .wn-section { border-radius: 28px; padding-left: 1.5rem; padding-right: 1.5rem; }
          .wn-section .select-none { text-align: left; }
          .wn-section .mx-auto { max-width: 100%; }
          .wn-section .mt-4 { margin-top: 1.25rem; }
          .wn-section .mt-6 { margin-top: 1.4rem; }
          .wn-section .dash-path { stroke-width: 8; }
        }
      `}</style>
    </section>
  );
}
