import dynamic from "next/dynamic";

const ReviewQueueView = dynamic(() => import("@/components/cases/ReviewQueueView"), { ssr: false });

export default function ReviewQueuePage() {
  return <ReviewQueueView />;
}
