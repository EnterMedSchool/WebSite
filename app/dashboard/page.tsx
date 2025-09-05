import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-gray-600">Welcome back, {session.user?.name ?? "Learner"}.</p>
      <ul className="list-inside list-disc text-gray-700">
        <li>Track progress, streaks, and XP (future)</li>
        <li>Resume last course or quiz (future)</li>
        <li>Personalized recommendations (future)</li>
      </ul>
    </div>
  );
}

