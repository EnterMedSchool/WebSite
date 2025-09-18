import dynamic from "next/dynamic";
import MissionShowcase from "@/components/home/MissionShowcase";
import WhatsNew2026 from "@/components/home/WhatsNew2026";
import VibrantSectionStyles from "@/components/home/VibrantSectionStyles";
import CourseHub2026 from "@/components/home/CourseHub2026";
import HomeVibrantBackdrop from "@/components/home/HomeVibrantBackdrop";
import AnkiIntegration from "@/components/home/AnkiIntegration";
import TeamFamily from "@/components/home/TeamFamily";
import ProgressTimeline from "@/components/home/ProgressTimeline";
import ReviewsSection from "@/components/home/ReviewsSection";
import SectionDivider from "@/components/home/SectionDivider";

const HomeMap = dynamic(() => import("@/components/home/HomeMap"), { ssr: false });

export default function DesktopHome() {
  return (
    <div className="space-y-12 overflow-x-hidden">
      <HomeVibrantBackdrop />
      <section
        id="universities"
        className="vbg vbg-blue relative w-full mt-0 -top-16 sm:-top-20 md:-top-24 overflow-hidden rounded-b-[36px] shadow-[0_16px_40px_rgba(49,46,129,0.08)] lg:left-1/2 lg:right-1/2 lg:-ml-[50vw] lg:-mr-[50vw] lg:w-screen"
      >
        <HomeMap />
        <div className="vbg-seam-bottom" />
      </section>

      <section className="vbg vbg-emerald relative -mt-8 z-10 mx-auto w-full max-w-6xl rounded-3xl px-4 py-6">
        <div className="vbg-seam-top" />
        <div className="pointer-events-none absolute -top-8 left-1/2 h-10 w-[92%] -translate-x-1/2 rounded-[48px] bg-[radial-gradient(140px_20px_at_50%_0%,rgba(99,102,241,0.10),transparent)]" />
        <MissionShowcase
          videoSrc="https://entermedschool.b-cdn.net/wp-content/uploads/2024/05/Vidinsta_Instagram-Post_6634e8cf0c8eb.mp4"
          poster="https://entermedschool.b-cdn.net/wp-content/uploads/2024/05/Untitled-design.png"
        />
        <div className="vbg-seam-bottom" />
      </section>

      <WhatsNew2026 />

      <section className="vbg vbg-amber relative w-full py-12 lg:left-1/2 lg:right-1/2 lg:-ml-[50vw] lg:-mr-[50vw] lg:w-screen">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <CourseHub2026 />
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      <section className="vbg vbg-violet relative w-full py-12 lg:left-1/2 lg:right-1/2 lg:-ml-[50vw] lg:-mr-[50vw] lg:w-screen">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <AnkiIntegration />
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      <SectionDivider />
      <ProgressTimeline />

      <section className="vbg vbg-rose relative w-full py-12 lg:left-1/2 lg:right-1/2 lg:-ml-[50vw] lg:-mr-[50vw] lg:w-screen">
        <div className="vbg-seam-top" />
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <TeamFamily />
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      <section className="vbg vbg-teal relative w-full py-12 lg:left-1/2 lg:right-1/2 lg:-ml-[50vw] lg:-mr-[50vw] lg:w-screen">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <ReviewsSection />
        </div>
        <div className="vbg-seam-bottom" />
      </section>

      <VibrantSectionStyles />
    </div>
  );
}
