import dynamic from "next/dynamic";

const HomeMap = dynamic(() => import("@/components/home/HomeMap"), { ssr: false });

export default function HomePage() {
  return (
    <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen mt-[-1.5rem]">
      <HomeMap />
    </section>
  );
}
