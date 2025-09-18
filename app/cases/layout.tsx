import type { Metadata } from "next";
import Link from "next/link";
import { currentUserIdServer } from "@/lib/study/auth";

export const metadata: Metadata = {
  title: "Clinical Reasoning Cases",
  description: "Adaptive clinical reasoning practice across exams and subjects.",
};

export default async function CasesLayout({ children }: { children: React.ReactNode }) {
  const userId = await currentUserIdServer();
  if (!userId) {
    return (
      <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-slate-950 px-4 pb-24 pt-32 text-slate-100">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-600/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative w-full max-w-xl rounded-3xl border border-slate-800/60 bg-slate-900/70 p-10 text-center shadow-2xl shadow-indigo-900/40 backdrop-blur">
          <h1 className="text-3xl font-semibold md:text-4xl">Sign in to access clinical cases</h1>
          <p className="mt-4 text-sm text-slate-300">
            We only load reasoning data for authenticated learners so we can personalise your plan and avoid unnecessary API calls.
          </p>
          <Link
            href="/signin?from=/cases"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.02] hover:shadow-indigo-700/40"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.25),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(244,114,182,0.2),transparent_55%),linear-gradient(180deg,rgba(15,23,42,0.95),#020617)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-20 mx-auto h-[480px] w-[480px] rounded-full bg-indigo-500/20 blur-[180px] md:w-[640px]" aria-hidden="true" />
      <div className="relative">{children}</div>
    </div>
  );
}
