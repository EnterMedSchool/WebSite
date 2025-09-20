import dynamic from "next/dynamic";
import MissionShowcase from "@/components/home/MissionShowcase";
import WhatsNew2026 from "@/components/home/WhatsNew2026";
import CourseHub2026 from "@/components/home/CourseHub2026";
import HomeBackdrop from "@/components/home/HomeBackdrop";
import AnkiIntegration from "@/components/home/AnkiIntegration";
import TeamFamily from "@/components/home/TeamFamily";
import ProgressTimeline from "@/components/home/ProgressTimeline";
import ReviewsSection from "@/components/home/ReviewsSection";
import SectionDivider from "@/components/home/SectionDivider";

const HomeMap = dynamic(() => import("@/components/home/HomeMap"), { ssr: false });

export default function DesktopHome() {
  return (
    <div className="relative space-y-12 overflow-x-hidden pb-14">
      <HomeBackdrop />
      <section
        id="universities"
        className="relative w-full -top-12 sm:-top-16 md:-top-20 px-4 sm:px-6 lg:px-0"
      >
        <div className="relative overflow-hidden rounded-[32px] shadow-[0_16px_40px_rgba(49,46,129,0.08)] lg:left-1/2 lg:right-1/2 lg:-ml-[50vw] lg:-mr-[50vw] lg:w-screen">
          <HomeMap />
        </div>
      </section>

      <section className="relative -mt-8 z-10 mx-auto w-full max-w-6xl rounded-3xl px-4 py-6">
        <MissionShowcase
          videoSrc="https://entermedschool.b-cdn.net/wp-content/uploads/2024/05/Vidinsta_Instagram-Post_6634e8cf0c8eb.mp4"
          poster="https://entermedschool.b-cdn.net/wp-content/uploads/2024/05/Untitled-design.png"
        />
      </section>

      <WhatsNew2026 />

      <section className="relative w-full py-12 lg:left-1/2 lg:right-1/2 lg:-ml-[50vw] lg:-mr-[50vw] lg:w-screen">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <CourseHub2026 />
        </div>
      </section>

      <section className="relative w-full py-12 lg:left-1/2 lg:right-1/2 lg:-ml-[50vw] lg:-mr-[50vw] lg:w-screen">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <AnkiIntegration />
        </div>
      </section>

      <SectionDivider />
      <ProgressTimeline />

      <section className="relative w-full py-12 lg:left-1/2 lg:right-1/2 lg:-ml-[50vw] lg:-mr-[50vw] lg:w-screen">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <TeamFamily />
        </div>
      </section>

      <section className="relative w-full py-12 lg:left-1/2 lg:right-1/2 lg:-ml-[50vw] lg:-mr-[50vw] lg:w-screen">
        <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
          <ReviewsSection />
        </div>
      </section>
    </div>
  );
}
