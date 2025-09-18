import dynamic from "next/dynamic";

const CasesLibraryView = dynamic(() => import("@/components/cases/CasesLibraryView"), { ssr: false });

export default function CasesLibraryPage() {
  return <CasesLibraryView />;
}
