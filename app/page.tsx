import dynamic from "next/dynamic";
import MissionShowcase from "@/components/home/MissionShowcase";
import LatestLessons from "@/components/home/LatestLessons";
import HowItWorks from "@/components/home/HowItWorks";
import Milestones from "@/components/home/Milestones";
import ExamsSection from "@/components/home/ExamsSection";
import LatestArticles from "@/components/home/LatestArticles";
import Family from "@/components/home/Family";
import HomeBackdrop from "@/components/home/HomeBackdrop";

const HomeMap = dynamic(() => import("@/components/home/HomeMap"), { ssr: false });

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Global background for the whole homepage */}
      <HomeBackdrop />
      {/* Map section with rounded base and soft fade */}
      <section
        id="universities"
        className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen mt-[-24px] overflow-hidden rounded-b-[36px] shadow-[0_16px_40px_rgba(49,46,129,0.08)]"
      >
        <HomeMap />
        {/* Soft fade into page background */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[var(--page-bg,#f6f7fb)]" />
      </section>

      {/* Seam: full-bleed gradient to avoid narrow highlights and side gaps */}
      {/* Removed buffer: background now handled globally by HomeBackdrop */}

      {/* Under-map framework (lifted slightly with a restrained glow) */}
      <section className="relative -mt-8 z-10 mx-auto w-full max-w-6xl px-4">
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
