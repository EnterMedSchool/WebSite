"use client";
import React from "react";

export default function WhatsNew2026() {
  return (
    <section
      id="whats-new-2026"
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen py-10 sm:py-14 md:py-16"
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
            <div className="mx-auto max-w-4xl">
              <span className="block text-[clamp(28px,5vw,42px)] text-indigo-900/70">
                What is new on
              </span>
              <div className="relative mt-1">
                <span
                  aria-hidden
                  className="block text-transparent heading-gradient text-[clamp(36px,10vw,92px)]"
                >
                  EnterMedSchool 2026
                </span>

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
          <div className="mx-auto mt-6 w-full max-w-3xl">
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
          <p className="mx-auto mt-4 max-w-3xl text-sm sm:text-base text-indigo-900/70">
            Big updates are here. Explore the improvements and new features we
            built for the 2026 season.
          </p>
        </div>
      </div>

      {/* Component-scoped styles for animation and gradient */}
      <style jsx>{`
        .heading-gradient {
          background-image: linear-gradient(
            90deg,
            #312e81 0%,
            #6366f1 20%,
            #a78bfa 40%,
            #06b6d4 60%,
            #6366f1 80%,
            #312e81 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          animation: wn2026-shimmer 10s linear infinite;
          text-shadow: 0 6px 30px rgba(99, 102, 241, 0.25);
        }
        @keyframes wn2026-shimmer {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
        .dash-path {
          stroke-dasharray: 180 22;
          stroke-dashoffset: 0;
          animation: wn2026-dash 4.5s ease-in-out infinite;
          filter: drop-shadow(0px 6px 18px rgba(99, 102, 241, 0.25));
        }
        @keyframes wn2026-dash {
          0% {
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dashoffset: 160;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </section>
  );
}
