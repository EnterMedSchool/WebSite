import type { Metadata } from "next";
import Link from "next/link";
import { currentUserIdServer } from "@/lib/study/auth";
import { PracticeProvider } from "@/components/usmle/PracticeProvider";
import PracticeTopNav from "@/components/usmle/PracticeTopNav";
import OnboardingOverlay from "@/components/usmle/OnboardingOverlay";
import PracticeRightDock from "@/components/usmle/PracticeRightDock";
import { fakePracticeBundle } from "@/lib/usmle/fake-data";
import type { PracticeBundle } from "@/lib/usmle/types";

export const metadata: Metadata = {
  title: "Clinical Reasoning Practice",
  description: "Deep clinical reasoning workouts and analytics for USMLE prep.",
};

export default async function UsmleLayout({ children }: { children: React.ReactNode }) {
  const userId = await currentUserIdServer();
  if (!userId) {
    return (
      <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-slate-950 px-4 pb-24 pt-32 text-slate-100">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-600/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative w-full max-w-xl rounded-3xl border border-slate-800/60 bg-slate-900/70 p-10 text-center shadow-2xl shadow-indigo-900/40 backdrop-blur">
          <h1 className="text-3xl font-semibold md:text-4xl">Sign in to access Clinical Cases</h1>
          <p className="mt-4 text-sm text-slate-300">
            This reasoning lab is only available to authenticated learners so we can personalize your plan and keep your progress in sync.
          </p>
          <Link
            href="/signin?from=/usmle"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.02] hover:shadow-indigo-700/40"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const cloned: PracticeBundle = JSON.parse(JSON.stringify(fakePracticeBundle));
  cloned.user.id = userId;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.25),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(244,114,182,0.2),transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.95),#020617)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-20 mx-auto h-[480px] w-[480px] rounded-full bg-indigo-500/20 blur-[180px] md:w-[640px]" aria-hidden="true" />
      <PracticeProvider bundle={cloned}>
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <header className="pt-10 pb-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-950/40 backdrop-blur-md md:p-8">
              <div className="absolute -top-20 -right-10 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl" aria-hidden="true" />
              <div className="absolute -bottom-24 -left-12 h-60 w-60 rounded-full bg-sky-500/20 blur-3xl" aria-hidden="true" />
              <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                  <p className="inline-flex items-center rounded-full bg-indigo-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-200">
                    Clinical reasoning lab
                  </p>
                  <h1 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
                    Sharpen diagnostics, not just recall
                  </h1>
                  <p className="mt-4 text-sm text-slate-300 md:text-base">
                    Practice stepwise clinical decision-making with adaptive cases, instant coaching, and rich analytics tailored to your blueprint gaps.
                  </p>
                </div>
                <aside className="relative w-full max-w-sm rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-600/30 via-slate-900/80 to-sky-500/20 p-5 text-sm text-indigo-100 shadow-lg">
                  <div className="absolute -top-8 right-6 h-16 w-16 rounded-full bg-fuchsia-500/30 blur-xl" aria-hidden="true" />
                  <span className="text-xs uppercase tracking-[0.35em] text-indigo-200">Today focus</span>
                  <p className="mt-3 text-lg font-semibold text-white">Reasoning over recall - Bias awareness - Adaptive review</p>
                  <p className="mt-3 text-xs text-indigo-100/80">No extra API calls, everything stays in-memory until you launch a real session.</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-indigo-200/80">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    Ready for warm-up + 2 cases + review
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
    </div>
  );
}
