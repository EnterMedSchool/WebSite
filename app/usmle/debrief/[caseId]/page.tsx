import dynamic from "next/dynamic";

const CaseDebrief = dynamic(() => import("@/components/usmle/CaseDebrief"), { ssr: false });

export default function CaseDebriefPage({ params }: { params: { caseId: string } }) {
  return <CaseDebrief caseId={params.caseId} />;
}
