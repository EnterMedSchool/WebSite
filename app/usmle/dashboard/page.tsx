import dynamic from "next/dynamic";

const SessionSummaryView = dynamic(() => import("@/components/usmle/SessionSummaryView"), { ssr: false });
const PracticeDashboard = dynamic(() => import("@/components/usmle/PracticeDashboard"), { ssr: false });

export default function DashboardPage() {
  return (
    <div className="space-y-12">
      <SessionSummaryView />
      <PracticeDashboard />
    </div>
  );
}
