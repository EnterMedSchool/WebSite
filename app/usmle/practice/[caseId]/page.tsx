import dynamic from "next/dynamic";

const CasePlayer = dynamic(() => import("@/components/usmle/CasePlayer"), { ssr: false });

export default function CasePlayerPage({ params }: { params: { caseId: string } }) {
  return <CasePlayer caseId={params.caseId} />;
}
