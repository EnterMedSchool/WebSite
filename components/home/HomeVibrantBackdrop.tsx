"use client";

export default function HomeVibrantBackdrop() {
  return (
    <div aria-hidden className="home-vbg">
      <style jsx>{`
        .home-vbg { position: fixed; inset: 0; z-index: -10; pointer-events: none; }
        .home-vbg::before { content: ""; position: absolute; inset: 0; background:
          linear-gradient(to bottom,
            rgba(167,139,250,0.16) 0px,
            rgba(99,102,241,0.12) 280px,
            rgba(6,182,212,0.10) 760px,
            rgba(59,130,246,0.06) 1200px,
            rgba(255,255,255,0.0) 1800px
          ); }
        .home-vbg::after { content: ""; position: absolute; inset: -10% -10% -10% -10%; background:
          radial-gradient(900px 380px at 10% 18%, rgba(167,139,250,.22), transparent 62%),
          radial-gradient(1000px 420px at 88% 62%, rgba(6,182,212,.20), transparent 64%);
          filter: saturate(115%); animation: hvbg-float 22s ease-in-out infinite alternate; }
        @keyframes hvbg-float { from { transform: translateY(0) } to { transform: translateY(14px) } }
        @media (prefers-reduced-motion: reduce) { .home-vbg::after { animation: none; } }
      `}</style>
    </div>
  );
}

