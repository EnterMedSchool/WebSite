"use client";

import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { MCQ } from "@/components/lesson/MCQPanel";

export type QStatus = "correct" | "incorrect" | undefined;

export type LessonQuestionItem = {
  id: string;
  title: string;
  status: "todo" | "correct" | "incorrect";
};

export type LessonLessonMenuItem = {
  title: string;
  href: string;
  total: number;
  done: boolean;
  current: boolean;
};

export interface LessonPageContextValue {
  slug: string;
  authed: boolean;
  tab: "learn" | "practice" | "background";
  setTab: Dispatch<SetStateAction<"learn" | "practice" | "background">>;
  focusMode: boolean;
  toggleFocusMode: () => void;
  completed: boolean;
  canToggleCompleted: boolean;
  toggleCompleted: () => void;
  fav: boolean;
  toggleFavorite: () => void;
  flashcardsOpen: boolean;
  openFlashcards: () => void;
  closeFlashcards: () => void;
  bundle: any | null;
  bundleErr: string | null;
  player: any | null;
  playerErr: string | null;
  guest: any | null;
  course: { slug: string; title: string };
  chapter: { slug: string; title: string };
  lessonTitle: string;
  bodyHtml: string;
  authors: { author?: string; reviewer?: string };
  chapterSummary: any | null;
  chapterSummaryErr: string | null;
  lessonsList: any[];
  chapterDotsCount: number;
  activeDot: number;
  chapterCompletedList: boolean[];
  chapterLabels: string[];
  chapterLabelsDetailed: string[];
  chapterLessonMenu: LessonLessonMenuItem[];
  chapterQTotal: number;
  chapterQCorrect: number;
  chapterLessonsDone: number;
  chapterLessonsTotal: number;
  chapterPctUnits: number;
  qCorrect: number;
  relevantQuestions: LessonQuestionItem[];
  effectiveIframeSrc: string;
  courseIdNum: number;
  mcqs: MCQ[];
  initialStatus: Record<number, QStatus>;
  practiceAll: boolean;
  setPracticeAll: Dispatch<SetStateAction<boolean>>;
  openQuestionId: number | null;
  setOpenQuestionId: Dispatch<SetStateAction<number | null>>;
  openPracticeAll: () => void;
  openPracticeQuestion: (id: number) => void;
  onAnswerQuestion: (qid: number, status: QStatus) => void;
  bundleHasQuestions: boolean;
  canPractice: boolean;
  saveDockCourseId: number;
}

export const LessonPageContext = createContext<LessonPageContextValue | undefined>(undefined);

export function useLessonPageContext(): LessonPageContextValue {
  const ctx = useContext(LessonPageContext);
  if (!ctx) {
    throw new Error("useLessonPageContext must be used within a LessonPageContext provider");
  }
  return ctx;
}
