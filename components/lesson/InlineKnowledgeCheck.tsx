"use client";

import { useState } from "react";

export default function InlineKnowledgeCheck() {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="mb-2 text-sm font-semibold text-indigo-900">Quick check</div>
      <div className="text-sm text-gray-800">Which lab marker best reflects fibrin breakdown?</div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {['D-dimer','LDH','Albumin','AST'].map((c) => (
          <button key={c} className="h-11 rounded-xl border bg-white px-3 text-left text-sm hover:bg-indigo-50">
            {c}
          </button>
        ))}
      </div>
      <button onClick={() => setRevealed((v)=>!v)} className="mt-3 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">
        {revealed ? 'Hide answer' : 'Show answer'}
      </button>
      {revealed && (
        <div className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-inset ring-emerald-200">
          Correct: D-dimer. It is a fibrin degradation product.
        </div>
      )}
    </div>
  );
}

