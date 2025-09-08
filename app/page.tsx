import dynamic from "next/dynamic";
import MissionShowcase from "@/components/home/MissionShowcase";
import LatestLessons from "@/components/home/LatestLessons";
import HowItWorks from "@/components/home/HowItWorks";
import Milestones from "@/components/home/Milestones";
import ExamsSection from "@/components/home/ExamsSection";
import LatestArticles from "@/components/home/LatestArticles";
import Family from "@/components/home/Family";
import SectionDivider from "@/components/ui/SectionDivider";

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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[var(--page-bg,#f6f7fb)]" />
      </section>

      {/* Gentle wave divider to visually connect to the next block */}
      <SectionDivider className="-mt-6" />

      {/* Under-map framework (lifted up slightly with a subtle glow) */}
      <section className="relative -mt-6 z-10 mx-auto w-full max-w-6xl px-4">
        <div className="pointer-events-none absolute -top-8 left-1/2 h-12 w-[92%] -translate-x-1/2 rounded-[48px] bg-[radial-gradient(120px_20px_at_50%_0%,rgba(99,102,241,0.18),transparent)]" />
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
