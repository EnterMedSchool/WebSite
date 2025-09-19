"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useChapterPageContext } from "@/components/chapter/context";
import styles from "./desktop-chapter.module.css";

export default function DesktopChapterShell() {
  const ctx = useChapterPageContext();
  const [tab, setTab] = useState<"overview" | "lessons">("overview");

  const timeline = useMemo(() => ctx.lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    state: lesson.completed ? "done" : lesson.slug === ctx.nextLessonSlug ? "current" : "todo",
  })), [ctx.lessons, ctx.nextLessonSlug]);

  const nextLesson = useMemo(
    () => ctx.lessons.find((lesson) => lesson.slug === ctx.nextLessonSlug) ?? null,
    [ctx.lessons, ctx.nextLessonSlug]
  );

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <section className={styles.header}>
          <div className={styles.headerMeta}>
            <div className={styles.tagRow}>
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
                <span className={styles.description}>{ctx.stats.completedCount}/{ctx.stats.totalLessons} lessons complete</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Question accuracy</span>
                <span className={styles.statValue}>{ctx.stats.totalCorrect}/{ctx.stats.totalQuestions || 0}</span>
                <span className={styles.description}>{ctx.stats.accuracyPct}% accuracy across the chapter</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Next lesson</span>
                <span className={styles.statValue}>{nextLesson ? nextLesson.title : "Completed"}</span>
                <span className={styles.description}>{nextLesson ? `Lesson ${nextLesson.position + 1}` : "You finished every lesson."}</span>
              </div>
            </div>
          </div>
          <div className={styles.actionColumn}>
            {ctx.nextLessonSlug ? (
              <Link href={`/lesson/${ctx.nextLessonSlug}`} className={styles.primaryButton}>
                {nextLesson && !nextLesson.completed ? "Resume chapter" : "Start chapter"}
              </Link>
            ) : null}
            {ctx.resumeLessonSlug && ctx.resumeLessonSlug !== ctx.nextLessonSlug ? (
              <Link href={`/lesson/${ctx.resumeLessonSlug}`} className={styles.secondaryButton}>
                Jump to saved lesson
              </Link>
            ) : null}
            {ctx.firstLessonSlug ? (
              <Link href={`/lesson/${ctx.firstLessonSlug}`} className={styles.secondaryButton}>
                View first lesson
              </Link>
            ) : null}
          </div>
        </section>

        <div className={styles.tabBar} role="tablist" aria-label="Chapter content">
          {[
            { id: "overview", label: "Overview" },
            { id: "lessons", label: "Lessons" },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              className={styles.tabButton}
              data-active={tab === option.id}
              onClick={() => setTab(option.id as "overview" | "lessons")}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          <div className={styles.leftColumn}>
            <div className={styles.panel}>
              <div className={styles.statLabel}>Chapter path</div>
              <div className={styles.timeline}>
                {timeline.map((item) => (
                  <div key={item.id} className={styles.timelineItem} data-state={item.state}>
                    {item.title}
                  </div>
                ))}
              </div>
            </div>
            {nextLesson ? (
              <div className={styles.panel}>
                <div className={styles.statLabel}>Up next</div>
                <div className={styles.lessonTitle}>Lesson {nextLesson.position + 1}: {nextLesson.title}</div>
                <div className={styles.lessonMeta}>
                  <span>{ctx.formatCount(nextLesson.totalQuestions, "question")}</span>
                  <span>{nextLesson.correct} correct logged</span>
                </div>
                <Link href={`/lesson/${nextLesson.slug}`} className={styles.primaryButton}>
                  Open lesson
                </Link>
              </div>
            ) : (
              <div className={styles.panel}>
                <div className={styles.statLabel}>Up next</div>
                <div className={styles.description}>You have completed every lesson in this chapter.</div>
              </div>
            )}
          </div>

          <div className={styles.panel}>
            {ctx.player?.iframeSrc ? (
              <div className={styles.videoFrame}>
                <iframe
                  className={styles.videoInner}
                  src={ctx.player.iframeSrc}
                  title="Chapter preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className={styles.description}>Preview video will appear here once available.</div>
            )}
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.panel}>
              <div className={styles.statLabel}>Quick stats</div>
              <div className={styles.lessonMeta}>
                <span>{ctx.stats.completedCount}/{ctx.stats.totalLessons} lessons complete</span>
                <span>{ctx.stats.totalCorrect}/{ctx.stats.totalQuestions || 0} correct answers</span>
                <span>{ctx.stats.accuracyPct}% accuracy</span>
              </div>
            </div>
            <div className={styles.panel}>
              <div className={styles.statLabel}>Stay on track</div>
              <p className={styles.description}>
                Plan your session around the next lesson and keep momentum with short recaps after each activity.
              </p>
              {ctx.nextLessonSlug ? (
                <Link href={`/lesson/${ctx.nextLessonSlug}`} className={styles.secondaryButton}>
                  Continue now
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {tab === "lessons" ? (
          <div className={styles.panel}>
            <div className={styles.statLabel}>Lessons</div>
            <div className={styles.lessonList}>
              {ctx.lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/lesson/${lesson.slug}`}
                  className={styles.lessonRow}
                  data-completed={lesson.completed}
                >
                  <div className={styles.lessonHeader}>
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
          </div>
        ) : (
          <div className={styles.panel}>
            <div className={styles.statLabel}>Overview</div>
            <p className={styles.description}>
              Work through each lesson sequentially, then revisit any weak spots using the question tallies to guide spaced review.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
