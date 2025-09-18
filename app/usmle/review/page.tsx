import dynamic from "next/dynamic";

const ReviewQueueView = dynamic(() => import("@/components/usmle/ReviewQueueView"), { ssr: false });

export default function ReviewQueuePage() {
  return <ReviewQueueView />;
}
