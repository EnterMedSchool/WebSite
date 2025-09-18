import dynamic from "next/dynamic";

const TodayView = dynamic(() => import("@/components/usmle/TodayView"), { ssr: false });

export default function UsmleTodayPage() {
  return <TodayView />;
}
