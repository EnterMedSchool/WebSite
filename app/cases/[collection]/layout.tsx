import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentUserIdServer } from "@/lib/study/auth";
import { loadCaseExperience } from "@/lib/cases/data";
import { PracticeProvider } from "@/components/cases/PracticeProvider";
import PracticeTopNav from "@/components/cases/PracticeTopNav";
import OnboardingOverlay from "@/components/cases/OnboardingOverlay";
import PracticeRightDock from "@/components/cases/PracticeRightDock";

export const metadata: Metadata = {
  title: "Clinical Reasoning Cases",
};

export default async function CasesCollectionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { collection: string };
}) {
  const userId = await currentUserIdServer();
  if (!userId) {
    notFound();
  }

  let experience;
  try {
    experience = await loadCaseExperience({ userId, collectionSlug: params.collection });
  } catch {
    notFound();
  }
  const bundle = experience!.bundle;

  return (
    <PracticeProvider bundle={bundle}>
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <header className="pt-10 pb-6">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-950/40 backdrop-blur-md md:p-8">
            <div className="absolute -top-20 -right-10 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-24 -left-12 h-60 w-60 rounded-full bg-sky-500/20 blur-3xl" aria-hidden="true" />
            <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <p className="inline-flex items-center rounded-full bg-indigo-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-200">
                  {bundle.collection.name}
                </p>
                <h1 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
                  Sharpen diagnostics, not just recall
                </h1>
                <p className="mt-4 text-sm text-slate-300 md:text-base">
                  Adaptive clinical cases and analytics tuned to {bundle.activeSubject.name.toLowerCase()} targets.
                </p>
              </div>
              <aside className="relative w-full max-w-sm rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/30 via-slate-900/80 to-sky-500/20 p-5 text-sm text-indigo-100 shadow-lg">
                <div className="absolute -top-8 right-6 h-16 w-16 rounded-full bg-fuchsia-500/30 blur-xl" aria-hidden="true" />
                <span className="text-xs uppercase tracking-[0.35em] text-indigo-200">Today focus</span>
                <p className="mt-3 text-lg font-semibold text-white">{bundle.notifications[0]?.message ?? "Reasoning reps queued"}</p>
                <p className="mt-3 text-xs text-indigo-100/80">Data stays local until you launch a real session, minimising API usage.</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-indigo-200/80">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  Ready for warm-up + {bundle.todayPlan[1]?.items.length ?? 0} cases + review
                </div>
              </aside>
            </div>
          </div>
        </header>
        <PracticeTopNav />
        <main className="pt-8 pb-12 lg:pb-16">{children}</main>
      </div>
      <OnboardingOverlay />
      <PracticeRightDock />
    </PracticeProvider>
  );
}
