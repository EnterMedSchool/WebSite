"use client";

export default function SectionDivider() {
  return (
    <div className="sd-wrap" aria-hidden>
      <svg viewBox="0 0 1200 100" className="sd" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sd-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="40%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path d="M0,60 C200,10 400,110 600,60 C800,10 1000,110 1200,60" fill="none" stroke="url(#sd-stroke)" strokeWidth="8" strokeLinecap="round" className="dash" />
      </svg>
      <style jsx>{`
        .sd-wrap { width:100%; display:grid; place-items:center; padding: 6px 0 12px; }
        .sd { width: min(96%, 1100px); height: 22px; }
        .dash { stroke-dasharray: 160 18; animation: sd-dash 5s ease-in-out infinite; filter: drop-shadow(0px 6px 18px rgba(99,102,241,0.25)); }
        @keyframes sd-dash { 0%{ stroke-dashoffset: 0 } 50%{ stroke-dashoffset: 140 } 100%{ stroke-dashoffset: 0 } }
      `}</style>
    </div>
  );
}

