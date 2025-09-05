import dynamic from "next/dynamic";

const HomeMap = dynamic(() => import("@/components/home/HomeMap"), { ssr: false });

export default function HomePage() {
  return (
    <section className="mt-0 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
      <HomeMap />
    </section>
  );
}

