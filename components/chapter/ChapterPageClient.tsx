"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ChapterPageContextProvider, type ChapterLessonSummary, type ChapterPlayer, type ChapterStats } from "@/components/chapter/context";

const MobileChapterShell = dynamic(() => import("@/components/chapter/mobile/MobileChapterShell"));
const DesktopChapterShell = dynamic(() => import("@/components/chapter/desktop/DesktopChapterShell"));

export type ChapterPageClientProps = {
  chapter: { slug: string; title: string; description: string | null };
  course: { slug: string; title: string };
  lessons: ChapterLessonSummary[];
  stats: ChapterStats;
  player: ChapterPlayer | null;
  resumeLessonSlug: string | null;
  firstLessonSlug: string | null;
};

export default function ChapterPageClient({ chapter, course, lessons, stats, player, resumeLessonSlug, firstLessonSlug }: ChapterPageClientProps) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.matchMedia("(max-width: 768px)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const mql = window.matchMedia("(max-width: 768px)");
      const update = (event?: MediaQueryListEvent) => setIsMobile(event ? event.matches : mql.matches);
      update();
      mql.addEventListener?.("change", update);
      return () => mql.removeEventListener?.("change", update);
    } catch {
      return () => {};
    }
  }, []);

  const nextLessonSlug = useMemo(() => {
    const firstIncomplete = lessons.find((lesson) => !lesson.completed);
    return firstIncomplete?.slug ?? firstLessonSlug;
  }, [lessons, firstLessonSlug]);

  const contextValue = useMemo(() => ({
    chapter,
    course,
    lessons,
    stats,
    player,
    resumeLessonSlug,
    firstLessonSlug,
    nextLessonSlug,
    formatCount: (value: number, label: string) => (value === 1 ? `1 ${label}` : `${value} ${label}s`),
  }), [chapter, course, lessons, stats, player, resumeLessonSlug, firstLessonSlug, nextLessonSlug]);

  return (
    <ChapterPageContextProvider value={contextValue}>
      {isMobile ? <MobileChapterShell /> : <DesktopChapterShell />}
    </ChapterPageContextProvider>
  );
}
