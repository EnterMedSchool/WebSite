import dynamic from "next/dynamic";

const TodayView = dynamic(() => import("@/components/cases/TodayView"), { ssr: false });

export default function UsmleTodayPage() {
  return <TodayView />;
}
