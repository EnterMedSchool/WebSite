import dynamic from "next/dynamic";

const SessionBuilder = dynamic(() => import("@/components/usmle/SessionBuilder"), { ssr: false });

export default function BuildSessionPage() {
  return <SessionBuilder />;
}
