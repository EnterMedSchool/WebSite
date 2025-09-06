"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchHero() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <div className="my-8 rounded-2xl bg-indigo-50 p-6 sm:p-8">
      <h2 className="text-2xl font-bold tracking-tight text-indigo-800">Where would you like to EnterMedSchool?</h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="search">I want to EnterMedSchool in…</label>
        <input
          id="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="I want to EnterMedSchool in…"
          className="w-full flex-1 rounded-xl border bg-white px-4 py-3 text-base shadow-sm focus:border-indigo-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => router.push("/#universities")}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Search
        </button>
      </div>
      <div className="mt-2 text-sm text-indigo-700/80">Showing Medical Courses in English</div>
    </div>
  );
}

