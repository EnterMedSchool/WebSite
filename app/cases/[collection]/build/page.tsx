import dynamic from "next/dynamic";

const SessionBuilder = dynamic(() => import("@/components/cases/SessionBuilder"), { ssr: false });

export default function BuildSessionPage() {
  return <SessionBuilder />;
}
