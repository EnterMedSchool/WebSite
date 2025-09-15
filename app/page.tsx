import dynamic from "next/dynamic";
import MissionShowcase from "@/components/home/MissionShowcase";
import WhatsNew2026 from "@/components/home/WhatsNew2026";
import VibrantSectionStyles from "@/components/home/VibrantSectionStyles";
import CourseHub2026 from "@/components/home/CourseHub2026";
import HomeVibrantBackdrop from "@/components/home/HomeVibrantBackdrop";
import AnkiIntegration from "@/components/home/AnkiIntegration";
import TeamFamily from "@/components/home/TeamFamily";
// Home backdrop temporarily removed per design refresh
// Scroll-driven showcase and Sticky CTA temporarily removed

const HomeMap = dynamic(() => import("@/components/home/HomeMap"), { ssr: false });

export default function HomePage() {
  return (
    <div className="space-y-12">
      <HomeVibrantBackdrop />
      {/* Global background cleared for now */}
      {/* Map section with rounded base and soft fade */}
      <section
        id="universities"
        className="vbg vbg-blue relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen mt-0 -top-16 sm:-top-20 md:-top-24 overflow-hidden rounded-b-[36px] shadow-[0_16px_40px_rgba(49,46,129,0.08)]"
      >
        <HomeMap />
        {/* Soft fade into page background */}
        <div className="vbg-seam-bottom" />
      </section>

      {/* Seam: full-bleed gradient to avoid narrow highlights and side gaps */}
      {/* Removed buffer: background now handled globally by HomeBackdrop */}

      {/* Under-map framework (lifted slightly with a restrained glow) */}
      <section className="vbg vbg-emerald relative -mt-8 z-10 mx-auto w-full max-w-6xl rounded-3xl px-4 py-6">
        <div className="pointer-events-none absolute -top-8 left-1/2 h-10 w-[92%] -translate-x-1/2 rounded-[48px] bg-[radial-gradient(140px_20px_at_50%_0%,rgba(99,102,241,0.10),transparent)]" />
        <MissionShowcase videoSrc="https://entermedschool.b-cdn.net/wp-content/uploads/2024/05/Vidinsta_Instagram-Post_6634e8cf0c8eb.mp4" poster="https://entermedschool.b-cdn.net/wp-content/uploads/2024/05/Untitled-design.png" />
        <div className="vbg-seam-bottom" />
      </section>

      {/* Full‑bleed: What’s New 2026 */}
      <WhatsNew2026 />

      {/* Alternating section: Course Hub */}
      <section className="vbg vbg-amber relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen py-12">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <CourseHub2026 />
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      {/* Anki Integration */}
      <section className="vbg vbg-violet relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen py-12">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <AnkiIntegration />
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      {/* Family Team */}
      <section className="vbg vbg-rose relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen py-12">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <TeamFamily />
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      {/* Sections below temporarily removed */}
      <VibrantSectionStyles />
    </div>
  );
}






