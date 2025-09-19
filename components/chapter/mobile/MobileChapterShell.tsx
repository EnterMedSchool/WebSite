"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useChapterPageContext } from "@/components/chapter/context";
import styles from "./mobile-chapter.module.css";

export default function MobileChapterShell() {
  const ctx = useChapterPageContext();
  const [panel, setPanel] = useState<"overview" | "lessons">("overview");

  const nextLesson = useMemo(
    () => ctx.lessons.find((lesson) => lesson.slug === ctx.nextLessonSlug) ?? null,
    [ctx.lessons, ctx.nextLessonSlug]
  );

  return (
    <div className={styles.screen}>
      <div className={styles.safeArea}>
        <section className={styles.hero}>
          <div className={styles.pills}>
            <Link href={`/${ctx.course.slug}`}>{ctx.course.title}</Link>
            <span>•</span>
            <span>Chapter</span>
          </div>
          <h1 className={styles.title}>{ctx.chapter.title}</h1>
          {ctx.chapter.description ? <p className={styles.description}>{ctx.chapter.description}</p> : null}
          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Progress</span>
              <span className={styles.statValue}>{ctx.stats.progressPct}%</span>
              <span className={styles.description}>
                {ctx.stats.completedCount}/{ctx.stats.totalLessons} lessons complete
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Questions</span>
              <span className={styles.statValue}>{ctx.formatCount(ctx.stats.totalQuestions, "question")}</span>
              <span className={styles.description}>
                {ctx.stats.totalCorrect} correct • {ctx.stats.accuracyPct}% accuracy
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Next up</span>
              <span className={styles.statValue}>{nextLesson ? nextLesson.title : "All done"}</span>
              <span className={styles.description}>
                {nextLesson ? `Lesson ${nextLesson.position + 1}` : "You have completed this chapter."}
              </span>
            </div>
          </div>
          <div className={styles.heroActions}>
            {ctx.nextLessonSlug ? (
              <Link href={`/lesson/${ctx.nextLessonSlug}`} className={styles.primaryButton}>
                {nextLesson && !nextLesson.completed ? "Resume chapter" : "Start chapter"}
              </Link>
            ) : null}
            {ctx.resumeLessonSlug && ctx.resumeLessonSlug !== ctx.nextLessonSlug ? (
              <Link href={`/lesson/${ctx.resumeLessonSlug}`} className={styles.secondaryButton}>
                Jump to saved
              </Link>
            ) : null}
          </div>
        </section>

        {ctx.player?.iframeSrc ? (
          <section className={styles.sectionCard}>
            <div className={styles.videoFrame}>
              <iframe
                src={ctx.player.iframeSrc}
                className={styles.videoInner}
                title="Chapter preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </section>
        ) : null}

        {panel === "overview" ? (
          <section className={styles.sectionCard}>
            <div className={styles.statLabel}>Chapter summary</div>
            <div className={styles.description}>
              {ctx.chapter.description || "Focus on the essentials and progress lesson by lesson."}
            </div>
            {nextLesson ? (
              <div className={styles.lessonItem} data-completed={nextLesson.completed}>
                <div className={styles.lessonItemHeader}>
                  <span className={styles.lessonTitle}>Up next: {nextLesson.title}</span>
                  <span className={styles.chip}>Lesson {nextLesson.position + 1}</span>
                </div>
                <div className={styles.lessonMeta}>
                  <span>{ctx.formatCount(nextLesson.totalQuestions, "question")}</span>
                  <span>{nextLesson.correct} correct so far</span>
                </div>
                <div className={styles.heroActions}>
                  <Link href={`/lesson/${nextLesson.slug}`} className={styles.primaryButton}>Open lesson</Link>
                </div>
              </div>
            ) : (
              <div className={styles.description}>Great job! You have completed every lesson in this chapter.</div>
            )}
          </section>
        ) : null}

        {panel === "lessons" ? (
          <section className={styles.sectionCard}>
            <div className={styles.lessonList}>
              {ctx.lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/lesson/${lesson.slug}`}
                  className={styles.lessonItem}
                  data-completed={lesson.completed}
                >
                  <div className={styles.lessonItemHeader}>
                    <span className={styles.lessonTitle}>{lesson.title}</span>
                    {lesson.completed ? <span className={styles.chip} data-variant="complete">Completed</span> : null}
                  </div>
                  <div className={styles.lessonMeta}>
                    <span>{ctx.formatCount(lesson.totalQuestions, "question")}</span>
                    <span>{lesson.correct}/{Math.max(1, lesson.totalQuestions)} correct</span>
                    <span>Lesson {lesson.position + 1}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <nav className={styles.bottomDock} aria-label="Chapter navigation">
        <button
          type="button"
          className={styles.navButton}
          data-active={panel === "overview"}
          onClick={() => setPanel("overview")}
        >
          Overview
        </button>
        <button
          type="button"
          className={styles.navButton}
          data-active={panel === "lessons"}
          onClick={() => setPanel("lessons")}
        >
          Lessons
        </button>
        <Link
          href={ctx.nextLessonSlug ? `/lesson/${ctx.nextLessonSlug}` : ctx.firstLessonSlug ? `/lesson/${ctx.firstLessonSlug}` : "#"}
          className={styles.navButton}
          data-active={false}
        >
          Start
        </Link>
      </nav>
    </div>
  );
}
