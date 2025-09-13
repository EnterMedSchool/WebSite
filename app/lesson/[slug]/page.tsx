"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import VideoPanel from "@/components/lesson/VideoPanel";
import UniResources from "@/components/lesson/UniResources";
import AnkiDownload from "@/components/lesson/AnkiDownload";
import ConceptChecklist from "@/components/lesson/ConceptChecklist";
import BackgroundMap from "@/components/lesson/BackgroundMap";
import Glossary from "@/components/lesson/Glossary";
import StudyToolbar from "@/components/lesson/StudyToolbar";

export default function LessonPage() {
  const { slug: rawSlug } = useParams();
  const slug = String(rawSlug || "lesson");

  const [tab, setTab] = useState<"learn" | "practice">("learn");
  const [focusMode, setFocusMode] = useState(false);

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      {/* Header – UI only */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-5 text-white shadow-[0_14px_42px_rgba(49,46,129,0.35)] ring-1 ring-indigo-900/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Lesson: {slug}</h1>
            <div className="mt-3 w-full max-w-md text-xs font-medium text-white/90">
              <span>Pure UI preview (no data fetching)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-4">
        <StudyToolbar
          mode={tab}
          onMode={(m) => setTab(m)}
          onFocusToggle={() => setFocusMode((v) => !v)}
          focus={focusMode}
          softLockPractice={false}
        />
      </div>

      {/* Content area */}
      <div className={`mt-4 grid gap-4 ${focusMode ? '' : 'lg:grid-cols-[1fr_280px]'}`}>
        <div className="space-y-4">
          {/* Video panel – static example */}
          <VideoPanel
            src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            iframeSrc={undefined}
            locked={false}
            subtitles={[]}
            prev={null}
            next={null}
          />

          {/* Learn tab – static content */}
          {tab === "learn" && (
            <div className="prose prose-indigo max-w-none rounded-2xl border bg-white p-6 text-sm shadow-sm ring-1 ring-black/5">
              <h2>Overview</h2>
              <p>
                This is a simplified lesson UI. All data loading, analytics,
                progress tracking, and backend integrations are removed so we
                can iterate on visual design and interactions only.
              </p>
              <h3>Key Concepts</h3>
              <ul>
                <li>Clean, focused video experience</li>
                <li>Lightweight reading area</li>
                <li>Practice tab placeholder</li>
              </ul>
              <p>
                We’ll re-introduce features step by step once the core UI feels
                right and performance is solid.
              </p>
            </div>
          )}

          {/* Practice tab – placeholder only */}
          {tab === "practice" && (
            <div className="rounded-2xl border bg-white p-6 text-sm shadow-sm ring-1 ring-black/5">
              <div className="mb-2 text-sm font-semibold text-indigo-900">Practice</div>
              <p className="text-gray-700">Practice questions will appear here. For now, this is a UI-only placeholder.</p>
            </div>
          )}

          {/* Extras – UI-only widgets */}
          <UniResources enabled={false} comingSoon />
          <AnkiDownload comingSoon />
          <ConceptChecklist items={["Concept A", "Concept B", "Concept C"]} comingSoon />
          <BackgroundMap comingSoon />
        </div>

        {/* Sidebar */}
        {!focusMode && <Glossary />}
      </div>
    </div>
  );
}

