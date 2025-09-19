"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import LessonBody from "@/components/lesson/LessonBody";
import MCQPanel from "@/components/lesson/MCQPanel";
import BackgroundMap from "@/components/lesson/BackgroundMap";
import FlashcardsWidget from "@/components/flashcards/FlashcardsWidget";
import { dicDeck } from "@/data/flashcards/dic";
import SaveDock from "@/components/study/SaveDock";
import { useLessonPageContext } from "@/components/lesson/context";
import styles from "./mobile-lesson.module.css";

function PracticeDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <div className={styles.drawerRoot} aria-hidden={!open}>
      <div className={styles.drawerOverlay} data-open={open} onClick={onClose} />
      <div className={styles.drawerSurface} data-open={open}>
        <div className={styles.drawerHandle} />
        <div className={styles.drawerHeader}>
          <span className={styles.drawerTitle}>Practice questions</span>
          <button type="button" className={styles.drawerClose} onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function MobileLessonShell() {
  const ctx = useLessonPageContext();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const questionTotals = useMemo(() => {
    const total = ctx.relevantQuestions.length;
    const correct = ctx.qCorrect;
    const remaining = Math.max(0, total - correct);
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { total, correct, remaining, pct };
  }, [ctx.relevantQuestions, ctx.qCorrect]);

  const timeline = useMemo(() => {
    return ctx.lessonsList.map((lesson: any, index: number) => {
      const done = ctx.chapterCompletedList[index + 1] ?? false;
      const current = ctx.activeDot === index + 1;
      return {
        id: lesson.id,
        title: String(lesson.title),
        state: done ? "done" : current ? "current" : "todo",
      };
    });
  }, [ctx.lessonsList, ctx.chapterCompletedList, ctx.activeDot]);

  const openPracticeDrawer = () => {
    if (!ctx.canPractice) return;
    ctx.setTab("practice");
    setDrawerOpen(true);
  };

  const handlePracticeAll = () => {
    if (!ctx.canPractice) return;
    ctx.openPracticeAll();
    ctx.setTab("practice");
    setDrawerOpen(true);
  };

  const handlePracticeQuestion = (questionId: number) => {
    if (!ctx.canPractice) return;
    ctx.openPracticeQuestion(questionId);
    ctx.setTab("practice");
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  const practiceMessage = useMemo(() => {
    if (ctx.bundleErr === "unauthenticated") return "Log in to unlock practice questions.";
    if (ctx.bundleErr === "forbidden") return "This course is paid. Upgrade to practice these questions.";
    if (!ctx.bundleHasQuestions) return "Questions for this lesson are coming soon.";
    return "Tap a question to jump straight into the answer flow.";
  }, [ctx.bundleErr, ctx.bundleHasQuestions]);

  const isPracticeActive = ctx.tab === "practice";

  return (
    <div className={styles.screen}>
      <FlashcardsWidget open={ctx.flashcardsOpen} onClose={ctx.closeFlashcards} deck={dicDeck} title="DIC Review" />
      <div className={styles.safeArea}>
        <section className={styles.hero}>
          <div className={styles.tagRow}>
            <Link href={`/${ctx.course.slug}`}>{ctx.course.title}</Link>
            <span>•</span>
            <Link href={`/${ctx.course.slug}/${ctx.chapter.slug}`}>{ctx.chapter.title}</Link>
          </div>
          <h1 className={styles.title}>{ctx.lessonTitle}</h1>
          <div className={styles.meta}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Chapter progress</span>
              <span className={styles.statValue}>{ctx.chapterPctUnits}%</span>
              <span className={styles.footerMeta}>
                <span>
                  {ctx.chapterLessonsDone}/{ctx.chapterLessonsTotal} lessons
                </span>
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Question accuracy</span>
              <span className={styles.statValue}>
                {ctx.chapterQCorrect}/{ctx.chapterQTotal || 0}
              </span>
              <span className={styles.footerMeta}>
                <span>Across this chapter</span>
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Lesson status</span>
              <span className={styles.statValue}>{ctx.completed ? "Completed" : "In progress"}</span>
              <span className={styles.footerMeta}>
                <span>{questionTotals.correct} answers logged</span>
              </span>
            </div>
          </div>
          <div className={styles.actionRow}>
            <button type="button" className={styles.buttonPrimary} onClick={() => ctx.setTab("learn")}>Resume learning</button>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={ctx.toggleFavorite}
              aria-pressed={ctx.fav}
            >
              {ctx.fav ? "Saved" : "Save lesson"}
            </button>
            <button
              type="button"
              className={ctx.canToggleCompleted ? styles.buttonSecondary : styles.buttonMuted}
              onClick={ctx.toggleCompleted}
              disabled={!ctx.canToggleCompleted}
            >
              {!ctx.canToggleCompleted ? "Login to track" : ctx.completed ? "Mark not complete" : "Mark complete"}
            </button>
          </div>
          <div className={styles.footerMeta}>
            <span>
              Author{' '}
              <strong>{ctx.authors.author || '—'}</strong>
            </span>
            <span>
              Reviewed by{' '}
              <strong>{ctx.authors.reviewer || '—'}</strong>
            </span>
          </div>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.videoFrame}>
            {ctx.effectiveIframeSrc ? (
              <iframe
                src={ctx.effectiveIframeSrc}
                className={styles.videoInner}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title="Lesson video"
              />
            ) : (
              <div className={styles.videoInner} style={{ display: 'grid', placeItems: 'center', color: '#475569', fontWeight: 600 }}>
                Video coming soon
              </div>
            )}
            {ctx.player?.locked && (
              <div className={styles.videoInner} style={{ background: 'rgba(255,255,255,0.88)', display: 'grid', placeItems: 'center' }}>
                <div style={{ padding: '12px 16px', borderRadius: 16, background: '#fff', border: '1px solid rgba(148,163,184,0.35)', fontWeight: 600, color: '#1f2937' }}>
                  {ctx.player?.lockReason || 'Enroll to watch this video'}
                </div>
              </div>
            )}
          </div>
          <div className={styles.timeline}>
            {timeline.map((step) => (
              <div key={step.id} className={styles.timelineItem} data-state={step.state}>
                {step.title}
              </div>
            ))}
          </div>
        </section>

        {ctx.tab !== "background" && (
          <section className={styles.sectionCard}>
            {ctx.bodyHtml ? (
              <LessonBody slug={ctx.slug} html={ctx.bodyHtml} noApi={!ctx.authed} />
            ) : (
              <p style={{ color: '#64748b' }}>Loading lesson…</p>
            )}
          </section>
        )}

        {ctx.tab === "background" && (
          <section className={styles.sectionCard}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Background map</h2>
            <p style={{ color: '#475569' }}>Explore related knowledge to reinforce the lesson context.</p>
            <BackgroundMap comingSoon />
          </section>
        )}

        <section className={styles.practiceCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(30,64,175,0.65)' }}>Practice streak</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1f2937' }}>
                {questionTotals.correct}/{questionTotals.total || 0} correct ({questionTotals.pct}%)
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#1e3a8a' }}>{practiceMessage}</p>
            </div>
            <button
              type="button"
              className={ctx.canPractice ? styles.buttonPrimary : styles.buttonMuted}
              onClick={handlePracticeAll}
              disabled={!ctx.canPractice}
            >
              Practice all
            </button>
          </div>
          {ctx.relevantQuestions.length > 0 && (
            <div className={styles.practiceList}>
              {ctx.relevantQuestions.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  className={styles.practiceItem}
                  data-state={q.status}
                  onClick={() => handlePracticeQuestion(Number(q.id))}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(30,64,175,0.7)' }}>Question {idx + 1}</div>
                  <div>{q.title}</div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <nav className={styles.bottomDock} aria-label="Lesson navigation">
        <button
          type="button"
          className={styles.navButton}
          data-active={ctx.tab === "learn"}
          onClick={() => {
            ctx.setTab("learn");
            setDrawerOpen(false);
          }}
        >
          Learn
        </button>
        <button
          type="button"
          className={styles.navButton}
          data-active={isPracticeActive}
          onClick={openPracticeDrawer}
          disabled={!ctx.canPractice}
        >
          Practice
        </button>
        <button
          type="button"
          className={styles.navButton}
          data-active={ctx.tab === "background"}
          onClick={() => {
            ctx.setTab("background");
            setDrawerOpen(false);
          }}
        >
          Resources
        </button>
      </nav>

      <PracticeDrawer open={drawerOpen && ctx.canPractice} onClose={handleCloseDrawer}>
        {ctx.bundleHasQuestions ? (
          <MCQPanel
            courseId={ctx.courseIdNum}
            questions={ctx.mcqs}
            initialStatus={ctx.initialStatus}
            openAll={ctx.practiceAll}
            openOnlyId={ctx.openQuestionId}
            disabled={!ctx.authed}
            onAnswer={ctx.onAnswerQuestion}
          />
        ) : (
          <p style={{ color: '#475569' }}>{practiceMessage}</p>
        )}
      </PracticeDrawer>

      <SaveDock courseId={ctx.saveDockCourseId} />
    </div>
  );
}
