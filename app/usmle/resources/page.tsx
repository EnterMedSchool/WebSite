import dynamic from "next/dynamic";

const ResourcesView = dynamic(() => import("@/components/usmle/ResourcesView"), { ssr: false });

export default function ResourcesPage() {
  return <ResourcesView />;
}
