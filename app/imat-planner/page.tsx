import { IMAT_PLANNER } from "@/lib/imat/plan";
import Planner from "@/components/imat/Planner";
import { currentUserIdServer } from "@/lib/study/auth";

export const runtime = "nodejs";

export const metadata = {
  title: "IMAT Study Planner",
  description: "Interactive 8-week IMAT study planner with daily tasks, XP, and progress tracking.",
  robots: { index: false, follow: true },
};

export default async function ImatPlannerPage() {
  const userId = await currentUserIdServer();
  const isAuthed = !!userId;
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="font-[var(--font-baloo,_inherit)] text-3xl font-extrabold text-slate-900">IMAT Study Planner</h1>
      <p className="mt-2 text-sm text-slate-600">8-week daily schedule from Biology to Chemistry. Track progress, earn XP, and stay consistent.</p>

      {!isAuthed ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-slate-800 font-semibold mb-1">Sign in to use the interactive planner</div>
          <p className="text-sm text-slate-600">You’ll be able to check off tasks, earn XP, and save your progress.</p>
          <a href="/signin" className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700">Sign in</a>
        </div>
      ) : (
        <div className="mt-6">
          <Planner totalDays={IMAT_PLANNER.totalDays} />
        </div>
      )}
    </main>
  );
}

