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

const tabs = [
  { id: "learn" as const, label: "Overview" },
  { id: "practice" as const, label: "Quiz" },
  { id: "background" as const, label: "Resources" },
];

export default function DesktopLessonShell() {
  const ctx = useLessonPageContext();

  const questionTotals = useMemo(() => {
    const total = ctx.relevantQuestions.length;
    const correct = ctx.qCorrect;
    const remaining = Math.max(0, total - correct);
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { total, correct, remaining, pct };
  }, [ctx.relevantQuestions, ctx.qCorrect]);

  const practiceMessage = useMemo(() => {
    if (ctx.bundleErr === "unauthenticated") return "Log in to unlock practice questions.";
    if (ctx.bundleErr === "forbidden") return "This course is paid. Upgrade to practice these questions.";
    if (!ctx.bundleHasQuestions) return "Questions for this lesson are on the way.";
    return "Select a question or open the full practice flow.";
  }, [ctx.bundleErr, ctx.bundleHasQuestions]);

  const navigation = useMemo(() => {
    const list = ctx.chapterLessonMenu || [];
    const currentIndex = list.findIndex((item) => item.current);
    const prevLesson = currentIndex > 0 ? list[currentIndex - 1] : null;
    const nextLesson = currentIndex >= 0 && currentIndex < list.length - 1 ? list[currentIndex + 1] : null;
    return { prevLesson, nextLesson };
  }, [ctx.chapterLessonMenu]);

  const authorName = ctx.authors?.author ? String(ctx.authors.author) : "EMS Faculty";
  const reviewerName = ctx.authors?.reviewer ? String(ctx.authors.reviewer) : "Pending";

  return (
    <div className={styles.page}>
      <FlashcardsWidget open={ctx.flashcardsOpen} onClose={ctx.closeFlashcards} deck={dicDeck} title="DIC Review" />
      <div className={styles.shell} data-focus={ctx.focusMode}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div>
              <div className={styles.sidebarHeading}>Course Outline</div>
              <p className={styles.sidebarSubheading}>{ctx.course.title}</p>
            </div>
            <Link href={`/${ctx.course.slug}`} className={styles.sidebarLink}>
              View course
            </Link>
          </div>

          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionLabel}>{ctx.chapter.title}</div>
            <nav className={styles.sidebarList} aria-label="Lessons in this chapter">
              {ctx.chapterLessonMenu.length === 0 ? (
                <div className={styles.sidebarEmpty}>Lessons coming soon.</div>
              ) : (
                ctx.chapterLessonMenu.map((lesson) => (
                  <Link
                    key={lesson.href}
                    href={lesson.href}
                    className={styles.sidebarItem}
                    data-state={lesson.current ? "current" : lesson.done ? "done" : "todo"}
                    aria-current={lesson.current ? "page" : undefined}
                  >
                    <div className={styles.sidebarItemTitle}>{lesson.title}</div>
                    <div className={styles.sidebarItemMeta}>
                      {lesson.current ? "In progress" : lesson.done ? "Completed" : lesson.total ? `${lesson.total} questions` : "Preview"}
                    </div>
                  </Link>
                ))
              )}
            </nav>
          </div>

          <div className={styles.sidebarStats}>
            <div className={styles.sidebarStatCard}>
              <div className={styles.sidebarStatLabel}>Chapter Progress</div>
              <div className={styles.sidebarStatValue}>{ctx.chapterPctUnits}%</div>
              <div className={styles.sidebarStatMeta}>
                {ctx.chapterLessonsDone}/{ctx.chapterLessonsTotal} lessons done
              </div>
            </div>
            <div className={styles.sidebarStatCard}>
              <div className={styles.sidebarStatLabel}>Question Accuracy</div>
              <div className={styles.sidebarStatValue}>
                {ctx.chapterQCorrect}/{ctx.chapterQTotal || 0}
              </div>
              <div className={styles.sidebarStatMeta}>Across this chapter</div>
            </div>
          </div>
        </aside>

        <div className={styles.mainArea}>
          <header className={styles.hero}>
            <div className={styles.heroBackdrop} aria-hidden="true" />
            <div className={styles.heroInner}>
              <div className={styles.heroTop}>
                <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                  <Link href={`/${ctx.course.slug}`} className={styles.breadcrumbLink}>
                    {ctx.course.title}
                  </Link>
                  <span className={styles.breadcrumbSeparator} aria-hidden="true">/</span>
                  <span className={styles.breadcrumbCurrent}>{ctx.chapter.title}</span>
                </nav>
                <div className={styles.heroControls}>
                  <button
                    type="button"
                    className={styles.heroControlButton}
                    data-active={ctx.focusMode}
                    onClick={ctx.toggleFocusMode}
                  >
                    {ctx.focusMode ? "Exit focus" : "Focus mode"}
                  </button>
                  <button
                    type="button"
                    className={styles.heroControlButton}
                    data-active={ctx.fav}
                    aria-pressed={ctx.fav}
                    onClick={ctx.toggleFavorite}
                  >
                    {ctx.fav ? "Saved" : "Save lesson"}
                  </button>
                  <button
                    type="button"
                    className={styles.heroControlButton}
                    onClick={ctx.toggleCompleted}
                    disabled={!ctx.canToggleCompleted}
                  >
                    {!ctx.canToggleCompleted
                      ? "Login to track"
                      : ctx.completed
                        ? "Mark not complete"
                        : "Mark complete"}
                  </button>
                </div>
              </div>

              <div className={styles.heroBody}>
                <div className={styles.heroTitleBlock}>
                  <div className={styles.heroCoursePill}>{ctx.course.title}</div>
                  <h1 className={styles.heroTitle}>{ctx.lessonTitle}</h1>
                  <div className={styles.heroMeta}>
                    <span>By {authorName}</span>
                    <span>
                      {ctx.chapterLessonsDone}/{ctx.chapterLessonsTotal} lessons done
                    </span>
                    <span>
                      {questionTotals.correct}/{questionTotals.total || 0} correct so far
                    </span>
                  </div>
                </div>
                <div className={styles.heroNav}>
                  {navigation.prevLesson ? (
                    <Link href={navigation.prevLesson.href} className={styles.heroNavButton}>
                      <span aria-hidden="true">⟵</span>
                      <span>Previous</span>
                    </Link>
                  ) : (
                    <span className={styles.heroNavButton} data-disabled="true">
                      <span aria-hidden="true">⟵</span>
                      <span>Previous</span>
                    </span>
                  )}
                  {navigation.nextLesson ? (
                    <Link href={navigation.nextLesson.href} className={styles.heroNavButton}>
                      <span>Next</span>
                      <span aria-hidden="true">⟶</span>
                    </Link>
                  ) : (
                    <span className={styles.heroNavButton} data-disabled="true">
                      <span>Next</span>
                      <span aria-hidden="true">⟶</span>
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.heroStats}>
                <div className={styles.heroStatCard}>
                  <div className={styles.heroStatLabel}>Chapter progress</div>
                  <div className={styles.heroStatValue}>{ctx.chapterPctUnits}%</div>
                  <div className={styles.heroStatMeta}>
                    {ctx.chapterLessonsDone}/{ctx.chapterLessonsTotal} lessons complete
                  </div>
                </div>
                <div className={styles.heroStatCard}>
                  <div className={styles.heroStatLabel}>Question accuracy</div>
                  <div className={styles.heroStatValue}>
                    {ctx.chapterQCorrect}/{ctx.chapterQTotal || 0}
                  </div>
                  <div className={styles.heroStatMeta}>Across this chapter</div>
                </div>
                <div className={styles.heroStatCard}>
                  <div className={styles.heroStatLabel}>Lesson status</div>
                  <div className={styles.heroStatValue}>{ctx.completed ? "Completed" : "In progress"}</div>
                  <div className={styles.heroStatMeta}>{questionTotals.correct} answers logged</div>
                </div>
              </div>
            </div>
          </header>

          <div className={styles.videoCard}>
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
                <div className={styles.videoPlaceholder}>Video coming soon</div>
              )}
              {ctx.player?.locked && (
                <div className={styles.videoOverlay}>
                  <div className={styles.videoOverlayContent}>
                    {ctx.player?.lockReason || "Enroll to access this video."}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.tabRow} role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={styles.tabButton}
                data-active={ctx.tab === tab.id}
                role="tab"
                aria-selected={ctx.tab === tab.id}
                onClick={() => ctx.setTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.mainGrid} data-focus={ctx.focusMode}>
            <section className={styles.lessonColumn}>
              {ctx.tab === "learn" && (
                <article className={styles.sectionCard}>
                  <header className={styles.sectionHeader}>
                    <div>
                      <div className={styles.sectionEyebrow}>Lesson overview</div>
                      <h2 className={styles.sectionTitle}>Course description</h2>
                      <p className={styles.sectionSubtitle}>
                        Work through the narrative, checkpoints, and visuals for this lesson.
                      </p>
                    </div>
                  </header>
                  <div className={styles.sectionBody}>
                    {ctx.bodyHtml ? (
                      <LessonBody slug={ctx.slug} html={ctx.bodyHtml} noApi={!ctx.authed} />
                    ) : (
                      <p className={styles.emptyState}>Loading lesson…</p>
                    )}
                  </div>
                </article>
              )}

              {ctx.tab === "practice" && (
                <article className={styles.sectionCard}>
                  <header className={styles.sectionHeader}>
                    <div>
                      <div className={styles.sectionEyebrow}>Quiz mode</div>
                      <h2 className={styles.sectionTitle}>Check your understanding</h2>
                      <p className={styles.sectionSubtitle}>{practiceMessage}</p>
                    </div>
                    <button
                      type="button"
                      className={ctx.canPractice ? styles.primaryButton : styles.disabledButton}
                      onClick={ctx.openPracticeAll}
                      disabled={!ctx.canPractice}
                    >
                      Start quiz
                    </button>
                  </header>
                  <div className={styles.practiceMetrics}>
                    <div className={styles.practiceMetric}>
                      <div className={styles.practiceMetricLabel}>Correct</div>
                      <div className={styles.practiceMetricValue}>{questionTotals.correct}</div>
                    </div>
                    <div className={styles.practiceMetric}>
                      <div className={styles.practiceMetricLabel}>Remaining</div>
                      <div className={styles.practiceMetricValue}>{questionTotals.remaining}</div>
                    </div>
                    <div className={styles.practiceMetric}>
                      <div className={styles.practiceMetricLabel}>Accuracy</div>
                      <div className={styles.practiceMetricValue}>{questionTotals.pct}%</div>
                    </div>
                  </div>
                  <div className={styles.sectionBody}>
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
                      <div className={styles.emptyState}>{practiceMessage}</div>
                    )}
                  </div>
                </article>
              )}

              {ctx.tab === "background" && (
                <article className={styles.sectionCard}>
                  <header className={styles.sectionHeader}>
                    <div>
                      <div className={styles.sectionEyebrow}>Resources</div>
                      <h2 className={styles.sectionTitle}>Background map</h2>
                      <p className={styles.sectionSubtitle}>
                        Trace supporting knowledge and recommended follow-up resources.
                      </p>
                    </div>
                  </header>
                  <div className={styles.sectionBody}>
                    <BackgroundMap comingSoon />
                  </div>
                </article>
              )}
            </section>

            <aside className={styles.rightRail}>
              <section className={styles.infoCard}>
                <div className={styles.infoCardHeader}>Course information</div>
                <dl className={styles.infoList}>
                  <div className={styles.infoRow}>
                    <dt className={styles.infoLabel}>Instructor</dt>
                    <dd className={styles.infoValue}>{authorName}</dd>
                  </div>
                  <div className={styles.infoRow}>
                    <dt className={styles.infoLabel}>Reviewer</dt>
                    <dd className={styles.infoValue}>{reviewerName}</dd>
                  </div>
                  <div className={styles.infoRow}>
                    <dt className={styles.infoLabel}>Lesson status</dt>
                    <dd className={styles.infoValue}>{ctx.completed ? "Completed" : "In progress"}</dd>
                  </div>
                </dl>
              </section>

              <section className={styles.infoCard}>
                <div className={styles.infoCardHeader}>Practice hub</div>
                <p className={styles.infoCopy}>{practiceMessage}</p>
                <button
                  type="button"
                  className={ctx.canPractice ? styles.secondaryButton : styles.disabledButton}
                  onClick={() => {
                    if (!ctx.canPractice) return;
                    ctx.openPracticeAll();
                    ctx.setTab("practice");
                  }}
                  disabled={!ctx.canPractice}
                >
                  Open quiz flow
                </button>
                {ctx.relevantQuestions.length > 0 && (
                  <div className={styles.questionList}>
                    {ctx.relevantQuestions.map((question, index) => (
                      <button
                        key={question.id}
                        type="button"
                        className={styles.questionItem}
                        data-state={question.status}
                        onClick={() => ctx.openPracticeQuestion(Number(question.id))}
                      >
                        <div className={styles.questionItemLabel}>Question {index + 1}</div>
                        <div className={styles.questionItemTitle}>{question.title}</div>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className={styles.infoCard}>
                <div className={styles.infoCardHeader}>Resource types</div>
                <ul className={styles.resourceList}>
                  <li className={styles.resourceItem}>
                    <div>
                      <div className={styles.resourceTitle}>Practice questions</div>
                      <div className={styles.resourceMeta}>
                        {ctx.bundleHasQuestions ? `${questionTotals.total} available` : "Coming soon"}
                      </div>
                    </div>
                  </li>
                  <li className={styles.resourceItem}>
                    <div>
                      <div className={styles.resourceTitle}>Flashcards deck</div>
                      <div className={styles.resourceMeta}>Micro review for quick recall</div>
                    </div>
                    <button type="button" className={styles.ghostButton} onClick={ctx.openFlashcards}>
                      Open
                    </button>
                  </li>
                  <li className={styles.resourceItem}>
                    <div>
                      <div className={styles.resourceTitle}>Background map</div>
                      <div className={styles.resourceMeta}>Concept graph preview</div>
                    </div>
                  </li>
                </ul>
              </section>
            </aside>
          </div>

          <SaveDock courseId={ctx.saveDockCourseId} />
        </div>
      </div>
    </div>
  );
}

