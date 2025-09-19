"use client";

import Link from "next/link";
import { useMemo } from "react";
import LessonBody from "@/components/lesson/LessonBody";
import MCQPanel from "@/components/lesson/MCQPanel";
import BackgroundMap from "@/components/lesson/BackgroundMap";
import FlashcardsWidget from "@/components/flashcards/FlashcardsWidget";
import { dicDeck } from "@/data/flashcards/dic";
import SaveDock from "@/components/study/SaveDock";
import { useLessonPageContext } from "@/components/lesson/context";
import styles from "./desktop-lesson.module.css";

export default function DesktopLessonShell() {
  const ctx = useLessonPageContext();

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

  const practiceMessage = useMemo(() => {
    if (ctx.bundleErr === "unauthenticated") return "Log in to unlock practice questions.";
    if (ctx.bundleErr === "forbidden") return "This course is paid. Upgrade to practice these questions.";
    if (!ctx.bundleHasQuestions) return "Questions for this lesson are on the way.";
    return "Select a question or open the full practice flow.";
  }, [ctx.bundleErr, ctx.bundleHasQuestions]);

  return (
    <div className={styles.page}>
      <FlashcardsWidget open={ctx.flashcardsOpen} onClose={ctx.closeFlashcards} deck={dicDeck} title="DIC Review" />
      <div className={styles.inner}>
        <section className={styles.header}>
          <div className={styles.headerMeta}>
            <div className={styles.tagRow}>
              <Link href={`/${ctx.course.slug}`}>{ctx.course.title}</Link>
              <span>•</span>
              <Link href={`/${ctx.course.slug}/${ctx.chapter.slug}`}>{ctx.chapter.title}</Link>
            </div>
            <h1 className={styles.title}>{ctx.lessonTitle}</h1>
            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Chapter progress</span>
                <span className={styles.statValue}>{ctx.chapterPctUnits}%</span>
                <span className={styles.footerMeta}>
                  <span>{ctx.chapterLessonsDone}/{ctx.chapterLessonsTotal} lessons complete</span>
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Question accuracy</span>
                <span className={styles.statValue}>{ctx.chapterQCorrect}/{ctx.chapterQTotal || 0}</span>
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
          </div>
          <div className={styles.actionColumn}>
            <button type="button" className={styles.primaryButton} onClick={() => ctx.setTab("learn")}>
              Resume learning
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={ctx.toggleFavorite}
              aria-pressed={ctx.fav}
            >
              {ctx.fav ? "Saved" : "Save lesson"}
            </button>
            <button
              type="button"
              className={ctx.canToggleCompleted ? styles.secondaryButton : styles.mutedButton}
              onClick={ctx.toggleCompleted}
              disabled={!ctx.canToggleCompleted}
            >
              {!ctx.canToggleCompleted ? "Login to track" : ctx.completed ? "Mark not complete" : "Mark complete"}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={ctx.openFlashcards}>
              Open flashcards deck
            </button>
            <div className={styles.footerMeta}>
              <span>
                Author <strong>{ctx.authors.author || '—'}</strong>
              </span>
              <span>
                Reviewed by <strong>{ctx.authors.reviewer || '—'}</strong>
              </span>
            </div>
          </div>
        </section>

        <div className={styles.tabBar} role="tablist">
          {(
            [
              { id: "learn", label: "Learn" },
              { id: "practice", label: "Practice" },
              { id: "background", label: "Resources" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={styles.tabButton}
              data-active={ctx.tab === tab.id}
              onClick={() => ctx.setTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.grid} data-focus={ctx.focusMode}>
          <aside className={`${styles.panel} ${styles.leftColumn}`}>
            <div>
              <div className={styles.cardTitle}>Chapter path</div>
              <div className={styles.timeline}>
                {timeline.map((item) => (
                  <div key={item.id} className={styles.timelineItem} data-state={item.state}>
                    {item.title}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className={styles.cardTitle}>Progress details</div>
              <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>
                {questionTotals.correct}/{questionTotals.total || 0} correct • {questionTotals.remaining} remaining
              </p>
            </div>
          </aside>

          <div style={{ display: 'grid', gap: '24px' }}>
            <div className={styles.panel}>
              <div className={styles.videoFrame}>
                {ctx.effectiveIframeSrc ? (
                  <iframe
                    className={styles.videoInner}
                    src={ctx.effectiveIframeSrc}
                    title="Lesson video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className={styles.videoInner} style={{ display: 'grid', placeItems: 'center', color: '#475569', fontWeight: 600 }}>
                    Video coming soon
                  </div>
                )}
                {ctx.player?.locked && (
                  <div className={styles.videoInner} style={{ background: 'rgba(255,255,255,0.9)', display: 'grid', placeItems: 'center' }}>
                    <div style={{ padding: '14px 18px', borderRadius: 18, background: '#fff', border: '1px solid rgba(148,163,184,0.35)', fontWeight: 600, color: '#1f2937' }}>
                      {ctx.player?.lockReason || 'Enroll to access this video.'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {ctx.tab === "learn" && (
              <div className={styles.panel}>
                {ctx.bodyHtml ? (
                  <LessonBody slug={ctx.slug} html={ctx.bodyHtml} noApi={!ctx.authed} />
                ) : (
                  <p style={{ color: '#64748b' }}>Loading lesson…</p>
                )}
              </div>
            )}

            {ctx.tab === "practice" && (
              <div className={styles.panel}>
                <div className={styles.practiceSummary}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(30,64,175,0.65)' }}>Practice deck</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
                      {questionTotals.correct}/{questionTotals.total || 0} correct ({questionTotals.pct}%)
                    </div>
                    <p style={{ margin: '4px 0 0', color: '#1d4ed8', fontSize: 14 }}>{practiceMessage}</p>
                  </div>
                  <button
                    type="button"
                    className={ctx.canPractice ? styles.primaryButton : styles.mutedButton}
                    onClick={ctx.openPracticeAll}
                    disabled={!ctx.canPractice}
                  >
                    Open all questions
                  </button>
                </div>
                {ctx.bundleHasQuestions ? (
                  <div style={{ marginTop: 20 }}>
                    <MCQPanel
                      courseId={ctx.courseIdNum}
                      questions={ctx.mcqs}
                      initialStatus={ctx.initialStatus}
                      openAll={ctx.practiceAll}
                      openOnlyId={ctx.openQuestionId}
                      disabled={!ctx.authed}
                      onAnswer={ctx.onAnswerQuestion}
                    />
                  </div>
                ) : (
                  <p style={{ marginTop: 20, color: '#475569' }}>{practiceMessage}</p>
                )}
              </div>
            )}

            {ctx.tab === "background" && (
              <div className={styles.panel}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Background map</h2>
                <p style={{ color: '#475569', fontSize: 14 }}>Explore supporting knowledge for this lesson.</p>
                <BackgroundMap comingSoon />
              </div>
            )}
          </div>

          <aside className={styles.rightColumn}>
            <div className={styles.panel}>
              <div className={styles.cardTitle}>Quick practice</div>
              <p style={{ color: '#475569', fontSize: 14, marginBottom: 12 }}>{practiceMessage}</p>
              <button
                type="button"
                className={ctx.canPractice ? styles.secondaryButton : styles.mutedButton}
                onClick={() => {
                  if (!ctx.canPractice) return;
                  ctx.openPracticeAll();
                  ctx.setTab("practice");
                }}
                disabled={!ctx.canPractice}
              >
                Open practice flow
              </button>
              {ctx.relevantQuestions.length > 0 && (
                <div className={styles.practiceList}>
                  {ctx.relevantQuestions.map((q, idx) => (
                    <button
                      key={q.id}
                      type="button"
                      className={styles.practiceItem}
                      data-state={q.status}
                      onClick={() => ctx.openPracticeQuestion(Number(q.id))}
                    >
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(30,64,175,0.7)' }}>Question {idx + 1}</div>
                      <div>{q.title}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.panel}>
              <div className={styles.cardTitle}>Flashcards</div>
              <p style={{ color: '#475569', fontSize: 14 }}>Reinforce this lesson with a quick micro deck.</p>
              <button type="button" className={styles.secondaryButton} onClick={ctx.openFlashcards}>
                Open deck
              </button>
            </div>

            <div className={styles.panel}>
              <div className={styles.cardTitle}>Need a break?</div>
              <p style={{ color: '#475569', fontSize: 14 }}>Toggle focus mode in the learner toolbar to hide side panels and read distraction-free.</p>
              <button type="button" className={styles.secondaryButton} onClick={ctx.toggleFocusMode}>
                {ctx.focusMode ? "Disable focus mode" : "Enable focus mode"}
              </button>
            </div>
          </aside>
        </div>

        <SaveDock courseId={ctx.saveDockCourseId} />
      </div>
    </div>
  );
}
