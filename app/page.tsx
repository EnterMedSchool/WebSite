import dynamic from "next/dynamic";
import MissionShowcase from "@/components/home/MissionShowcase";
import WhatsNew2026 from "@/components/home/WhatsNew2026";
// Home backdrop temporarily removed per design refresh
// Scroll-driven showcase and Sticky CTA temporarily removed

const HomeMap = dynamic(() => import("@/components/home/HomeMap"), { ssr: false });

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Global background cleared for now */}
      {/* Map section with rounded base and soft fade */}
      <section
        id="universities"
        className="vbg vbg-blue relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen mt-0 -top-16 sm:-top-20 md:-top-24 overflow-hidden rounded-b-[36px] shadow-[0_16px_40px_rgba(49,46,129,0.08)]"
      >
        <HomeMap />
        {/* Soft fade into page background */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-transparent" />
      </section>

      {/* Seam: full-bleed gradient to avoid narrow highlights and side gaps */}
      {/* Removed buffer: background now handled globally by HomeBackdrop */}

      {/* Under-map framework (lifted slightly with a restrained glow) */}
      <section className="vbg vbg-emerald relative -mt-8 z-10 mx-auto w-full max-w-6xl rounded-3xl px-4 py-6">
        <div className="pointer-events-none absolute -top-8 left-1/2 h-10 w-[92%] -translate-x-1/2 rounded-[48px] bg-[radial-gradient(140px_20px_at_50%_0%,rgba(99,102,241,0.10),transparent)]" />
        <MissionShowcase videoSrc="https://entermedschool.b-cdn.net/wp-content/uploads/2024/05/Vidinsta_Instagram-Post_6634e8cf0c8eb.mp4" poster="https://entermedschool.b-cdn.net/wp-content/uploads/2024/05/Untitled-design.png" />
      </section>

      {/* Full‑bleed: What’s New 2026 */}
      <WhatsNew2026 />

      {/* Sections below temporarily removed */}
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
        @keyframes vbg-float { from { transform: translateY(0) } to { transform: translateY(12px) } }
        @keyframes vbg-grid { 0% { background-position: 0 0, 0 0 } 100% { background-position: 56px 0, 0 56px } }
        @media (prefers-reduced-motion: reduce) { .vbg::before, .vbg::after { animation: none; } }
      `}</style>
    </div>
  );
}






