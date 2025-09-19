import type { Metadata } from "next";
import Link from "next/link";
import { currentUserIdServer } from "@/lib/study/auth";
import { CASE_CANVAS_BACKGROUND, CASE_PANEL_CLASS, CASE_GRADIENT_BUTTON } from "@/components/cases/theme";

export const metadata: Metadata = {
  title: "Clinical Reasoning Cases",
  description: "Adaptive clinical reasoning practice across exams and subjects.",
};

export default async function CasesLayout({ children }: { children: React.ReactNode }) {
  const userId = await currentUserIdServer();
  if (!userId) {
    return (
      <div className={`relative flex min-h-[60vh] items-center justify-center overflow-hidden ${CASE_CANVAS_BACKGROUND} px-4 pb-24 pt-32`}>
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-600/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" aria-hidden="true" />
        <div className={`relative w-full max-w-xl ${CASE_PANEL_CLASS} p-10 text-center`}>
          <h1 className="text-3xl font-semibold md:text-4xl">Sign in to access clinical cases</h1>
          <p className="mt-4 text-sm text-slate-200">
            We only load reasoning data for authenticated learners so we can personalise your plan and avoid unnecessary API calls.
          </p>
          <Link
            href="/signin?from=/cases"
            className={`mt-8 inline-flex items-center justify-center rounded-full ${CASE_GRADIENT_BUTTON} px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.02] hover:shadow-indigo-700/40`}
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen overflow-hidden ${CASE_CANVAS_BACKGROUND}`}>
      <div className="pointer-events-none absolute inset-x-0 top-20 mx-auto h-[480px] w-[480px] rounded-full bg-indigo-500/25 blur-[180px] md:w-[640px]" aria-hidden="true" />
      <div className="relative">{children}</div>
    </div>
  );
}
