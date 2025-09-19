"use client";

import { createContext, useContext } from "react";

export type ChapterLessonSummary = {
  id: number;
  slug: string;
  title: string;
  position: number;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  completed: boolean;
};

export type ChapterStats = {
  totalLessons: number;
  completedCount: number;
  totalQuestions: number;
  totalCorrect: number;
  progressPct: number;
  accuracyPct: number;
};

export type ChapterPlayer = {
  iframeSrc: string | null;
};

export interface ChapterPageContextValue {
  chapter: { slug: string; title: string; description: string | null };
  course: { slug: string; title: string };
  lessons: ChapterLessonSummary[];
  stats: ChapterStats;
  player: ChapterPlayer | null;
  resumeLessonSlug: string | null;
  firstLessonSlug: string | null;
  nextLessonSlug: string | null;
  formatCount: (value: number, label: string) => string;
}

const ChapterPageContext = createContext<ChapterPageContextValue | undefined>(undefined);

export const ChapterPageContextProvider = ChapterPageContext.Provider;

export function useChapterPageContext(): ChapterPageContextValue {
  const ctx = useContext(ChapterPageContext);
  if (!ctx) {
    throw new Error("useChapterPageContext must be used within a ChapterPageContextProvider");
  }
  return ctx;
}
