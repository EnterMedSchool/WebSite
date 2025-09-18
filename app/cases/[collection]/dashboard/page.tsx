import dynamic from "next/dynamic";

const SessionSummaryView = dynamic(() => import("@/components/cases/SessionSummaryView"), { ssr: false });
const PracticeDashboard = dynamic(() => import("@/components/cases/PracticeDashboard"), { ssr: false });

export default function DashboardPage() {
  return (
    <div className="space-y-12">
      <SessionSummaryView />
      <PracticeDashboard />
    </div>
  );
}
