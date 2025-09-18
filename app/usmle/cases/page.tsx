import dynamic from "next/dynamic";

const CasesLibraryView = dynamic(() => import("@/components/usmle/CasesLibraryView"), { ssr: false });

export default function CasesLibraryPage() {
  return <CasesLibraryView />;
}
