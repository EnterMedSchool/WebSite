"use client";

export default function VibrantSectionStyles() {
  return (
    <style jsx>{`
      .vbg { position: relative; isolation: isolate; }
      .vbg::before { content: ""; position: absolute; inset: -15% -10% -10% -10%; z-index: -1; filter: saturate(120%);
        background:
          radial-gradient(900px 380px at 10% 28%, var(--c1), transparent 60%),
          radial-gradient(1000px 420px at 92% 70%, var(--c2), transparent 66%);
        animation: vbg-float 18s ease-in-out infinite alternate; }
      .vbg::after { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: .10;
        background-image:
          linear-gradient(to right, rgba(255,255,255,.35) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,.24) 1px, transparent 1px);
        background-size: 56px 56px; background-position: center; animation: vbg-grid 22s linear infinite; }
      .vbg-blue { --c1: rgba(59,130,246,.26); --c2: rgba(167,139,250,.26); background: linear-gradient(180deg, rgba(99,102,241,.12), rgba(6,182,212,.06)); }
      .vbg-emerald { --c1: rgba(16,185,129,.25); --c2: rgba(20,184,166,.22); background: linear-gradient(180deg, rgba(16,185,129,.10), rgba(59,130,246,.06)); }
      .vbg-amber { --c1: rgba(245,158,11,.24); --c2: rgba(251,113,133,.24); background: linear-gradient(180deg, rgba(251,191,36,.10), rgba(251,113,133,.08)); }
      @keyframes vbg-float { from { transform: translateY(0) } to { transform: translateY(12px) } }
      @keyframes vbg-grid { 0% { background-position: 0 0, 0 0 } 100% { background-position: 56px 0, 0 56px } }
      @media (prefers-reduced-motion: reduce) { .vbg::before, .vbg::after { animation: none; } }
    `}</style>
  );
}
