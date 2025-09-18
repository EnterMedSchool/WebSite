"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePractice } from "./PracticeProvider";

const tabs = [
  { key: "notes", label: "Notes" },
  { key: "bookmarks", label: "Bookmarks" },
  { key: "scratch", label: "Scratchpad" },
  { key: "shortcuts", label: "Shortcuts" },
] as const;

export default function PracticeRightDock() {
  const { bundle, state, toggleDrawer } = usePractice();
  const isOpen = state.openDrawers.context ?? false;
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>("notes");
  const [noteText, setNoteText] = useState("Key endocrine algorithms to revisit before mock exam.");
  const [scratchText, setScratchText] = useState("1) Gather vitals\n2) Labs ladder\n3) Decide next test");
  const bookmarks = useMemo(() => bundle.cases.slice(0, 4), [bundle.cases]);

  return (
    <>
      <button
        onClick={() => toggleDrawer("context")}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-indigo-500/60 bg-slate-950/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200 shadow-lg shadow-indigo-900/40 backdrop-blur transition hover:border-indigo-400 ${
          isOpen ? "scale-95" : "hover:scale-105"
        }`}
        aria-expanded={isOpen}
      >
        {isOpen ? "Close dock" : "Open dock"}
      </button>

      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-slate-900/85 text-slate-100 shadow-2xl shadow-indigo-950/40 backdrop-blur-xl transition-transform duration-300 ease-out lg:max-w-lg ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative h-full flex flex-col">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500" aria-hidden="true" />
          <header className="flex items-center justify-between border-b border-slate-800/60 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Context dock</p>
              <h3 className="mt-1 text-lg font-semibold text-white">Stay in flow</h3>
            </div>
            <button
              onClick={() => toggleDrawer("context")}
              className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
              aria-label="Close context dock"
            >
              Esc
            </button>
          </header>

          <nav className="flex gap-2 overflow-x-auto border-b border-slate-800/60 px-4 py-3 text-xs uppercase tracking-[0.3em] text-slate-300">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-3 py-1 font-semibold transition ${
                  activeTab === tab.key ? "bg-gradient-to-r from-indigo-500/60 to-sky-500/60 text-white" : "bg-slate-800/80 text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto px-6 py-5 text-sm">
            {activeTab === "notes" && (
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Pinned note</p>
                <textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  className="h-40 w-full resize-none rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-white shadow-inner shadow-indigo-900/40 focus:border-indigo-500 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-400">
                    Save locally
                  </button>
                </div>
              </div>
            )}

            {activeTab === "bookmarks" && (
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Bookmarked cases</p>
                <ul className="space-y-3">
                  {bookmarks.map((c) => (
                    <li key={c.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <p className="text-sm font-semibold text-white">{c.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{c.system} - {c.discipline}</p>
                      <div className="mt-3 flex gap-2 text-xs">
                        <Link href={`/usmle/practice/${c.id}`} className="rounded-full bg-indigo-500 px-3 py-1 text-white hover:bg-indigo-400">
                          Open
                        </Link>
                        <Link href={`/usmle/debrief/${c.id}`} className="rounded-full bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700">
                          Debrief
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === "scratch" && (
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Scratchpad</p>
                <textarea
                  value={scratchText}
                  onChange={(event) => setScratchText(event.target.value)}
                  className="h-56 w-full resize-none rounded-2xl border border-slate-800 bg-slate-900/80 p-4 font-mono text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
                <div className="grid gap-2 text-xs text-slate-400">
                  <span>Tips:</span>
                  <span>- Shift + Enter to add checklist items.</span>
                  <span>- Drawer autosaves while open.</span>
                </div>
              </div>
            )}

            {activeTab === "shortcuts" && (
              <div className="space-y-4 text-sm text-slate-200">
                <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Keyboard map</p>
                <ul className="space-y-2">
                  {[
                    ["1-5", "Answer choices"],
                    ["Enter", "Submit response"],
                    ["C", "Confidence"],
                    ["H", "Highlight stem"],
                    ["S", "Strike distractor"],
                    ["]", "Toggle case drawer"],
                    ["Ctrl + .", "Open command palette"],
                  ].map(([key, helper]) => (
                    <li key={key} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs">
                      <kbd className="rounded bg-slate-800 px-3 py-1 font-semibold text-slate-100">{key}</kbd>
                      <span className="text-slate-300">{helper}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
