import dynamic from "next/dynamic";
import LearnAbout from "@/components/home/LearnAbout";
import HowItWorks from "@/components/home/HowItWorks";
import Milestones from "@/components/home/Milestones";
import ExamsSection from "@/components/home/ExamsSection";
import LatestArticles from "@/components/home/LatestArticles";
import Family from "@/components/home/Family";

const HomeMap = dynamic(() => import("@/components/home/HomeMap"), { ssr: false });

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Map section */}
      <section id="universities" className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen mt-[-0.5rem]">
        <HomeMap />
      </section>

      {/* Under-map framework */}
      <section className="mx-auto w-full max-w-6xl px-4">
        <LearnAbout />
        <HowItWorks />
        <Milestones />
        <ExamsSection />
        <LatestArticles />
        <Family />
      </section>
    </div>
  );
}
