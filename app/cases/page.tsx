import Link from "next/link";
import { loadCaseCollections } from "@/lib/cases/data";
import { currentUserIdServer } from "@/lib/study/auth";

export default async function CasesLandingPage() {
  const userId = await currentUserIdServer();
  if (!userId) {
    return null;
  }
  const collections = await loadCaseCollections();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl text-center sm:text-left">
        <p className="inline-flex items-center rounded-full bg-indigo-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-200">
          Clinical reasoning lab
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl lg:text-5xl">Choose your exam or subject</h1>
        <p className="mt-4 text-sm text-slate-300 md:text-base">
          Pick an exam collection to load personalised cases without extra API chatter. All data stays scoped to your account until you start a live session.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {collections.map((collection) => (
          <Link
            key={collection.slug}
            href={`/cases/${collection.slug}`}
            className="group relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-indigo-950/30 transition hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-indigo-800/30"
          >
            <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl transition-all group-hover:scale-110" aria-hidden="true" />
            <div className="relative">
              <h2 className="text-xl font-semibold text-white md:text-2xl">{collection.name}</h2>
              <p className="mt-2 text-sm text-slate-300">{collection.description ?? "Adaptive clinical cases with instant feedback."}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-indigo-200">Subjects</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-200">
                {collection.subjects.slice(0, 4).map((subject) => (
                  <span key={subject.slug} className="rounded-full bg-slate-900/80 px-3 py-1">
                    {subject.name}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
