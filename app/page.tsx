import dynamic from "next/dynamic";
import MissionShowcase from "@/components/home/MissionShowcase";
import LatestLessons from "@/components/home/LatestLessons";
import HowItWorks from "@/components/home/HowItWorks";
import Milestones from "@/components/home/Milestones";
import ExamsSection from "@/components/home/ExamsSection";
import LatestArticles from "@/components/home/LatestArticles";
import Family from "@/components/home/Family";

const HomeMap = dynamic(() => import("@/components/home/HomeMap"), { ssr: false });

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Map section with rounded base and soft fade */}
      <section
        id="universities"
        className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen mt-[-16px] overflow-hidden rounded-b-[36px] shadow-[0_16px_40px_rgba(49,46,129,0.08)]"
      >
        <HomeMap />
        {/* Soft fade into page background */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[var(--page-bg,#f6f7fb)]" />
      </section>

      {/* Seam: full-bleed gradient to avoid narrow highlights and side gaps */}
      <section aria-hidden className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen -mt-10 overflow-hidden">
        {/* Broad, subtle bridge from map to page bg (no hard white band) */}
        <div className="h-28 w-full bg-gradient-to-b from-transparent via-[rgba(99,102,241,0.035)] to-[var(--page-bg,#f6f7fb)]" />
        {/* Underpaint a very soft purple tint where the mission header begins */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-10 w-[1300px] -translate-x-1/2 rounded-full bg-[radial-gradient(600px_30px_at_50%_100%,rgba(67,56,202,0.06),transparent)]" />
      </section>

      {/* Under-map framework (lifted slightly with a restrained glow) */}
      <section className="relative -mt-12 z-10 mx-auto w-full max-w-6xl px-4">
        <div className="pointer-events-none absolute -top-8 left-1/2 h-10 w-[92%] -translate-x-1/2 rounded-[48px] bg-[radial-gradient(140px_20px_at_50%_0%,rgba(99,102,241,0.10),transparent)]" />
        <MissionShowcase videoSrc="https://entermedschool.b-cdn.net/wp-content/uploads/2024/05/Vidinsta_Instagram-Post_6634e8cf0c8eb.mp4" poster="https://entermedschool.b-cdn.net/wp-content/uploads/2024/05/Untitled-design.png" />
        <LatestLessons />
        <HowItWorks />
        <Milestones />
        <ExamsSection />
        <LatestArticles />
        <Family />
      </section>
    </div>
  );
}
