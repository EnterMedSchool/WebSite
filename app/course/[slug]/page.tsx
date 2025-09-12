import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CoursePage({ params }: { params: { slug: string } }) {
  // Temporarily disabled while optimizing large course pages
  return notFound();
}
