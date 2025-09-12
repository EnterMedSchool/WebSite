"use client";

import { useCallback, useMemo, useRef, useState } from "react";

type LessonLite = { id: number; slug: string; title: string };
type ChapterLite = { id: number; title: string; slug: string; lessons: LessonLite[] };
type CourseLite = { id: number; title: string; slug: string; chapters: ChapterLite[]; unassigned: LessonLite[] };

export default function CoursesBoard({ courses, moveAction }: { courses: CourseLite[]; moveAction: (fd: FormData) => Promise<void> }) {
  const [drag, setDrag] = useState<{ lessonId: number; fromCourseId: number; fromChapterId: number | null } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const lessonRef = useRef<{ [id: number]: { courseId: number; chapterId: number | null } }>({});

  // Build lookup for origin
  useMemo(() => {
    const map: { [id: number]: { courseId: number; chapterId: number | null } } = {};
    for (const c of courses) {
      for (const ch of c.chapters) {
        for (const l of ch.lessons) map[l.id] = { courseId: c.id, chapterId: ch.id };
      }
      for (const l of c.unassigned) map[l.id] = { courseId: c.id, chapterId: null };
    }
    lessonRef.current = map;
  }, [JSON.stringify(courses.map(c=>({id:c.id,chs:c.chapters.map(ch=>({id:ch.id,ls:ch.lessons.map(l=>l.id)})), u:c.unassigned.map(l=>l.id)})))]);

  const onDragStart = useCallback((lessonId: number, e: React.DragEvent) => {
    const origin = lessonRef.current[lessonId];
    if (!origin) return;
    setDrag({ lessonId, fromCourseId: origin.courseId, fromChapterId: origin.chapterId });
    try { e.dataTransfer.setData('text/plain', String(lessonId)); } catch {}
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const allowDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDropTo = useCallback(async (toCourseId: number, toChapterId: number | null, e: React.DragEvent) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData('text/plain');
    const lessonId = Number(idStr || drag?.lessonId);
    if (!Number.isFinite(lessonId)) return;
    const fd = new FormData(formRef.current || undefined);
    fd.set('lessonId', String(lessonId));
    fd.set('toCourseId', String(toCourseId));
    if (toChapterId) fd.set('toChapterId', String(toChapterId)); else fd.delete('toChapterId');
    await moveAction(fd);
    setDrag(null);
  }, [drag, moveAction]);

  return (
    <div>
      {/* Hidden action form */}
      <form ref={formRef} action={moveAction} className="hidden"><input name="lessonId" /><input name="toCourseId" /><input name="toChapterId" /></form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => (
          <div key={c.id} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-2">
              <div className="text-xs text-gray-500">{c.slug}</div>
              <div className="text-lg font-semibold text-gray-900">{c.title}</div>
            </div>

            {/* Unassigned bucket */}
            <div
              className="mb-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-2"
              onDragOver={allowDrop}
              onDrop={(e) => onDropTo(c.id, null, e)}
            >
              <div className="mb-1 text-xs font-semibold text-amber-800">Unassigned</div>
              <ul className="space-y-1">
                {c.unassigned.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 rounded-md border bg-white px-2 py-1 text-sm shadow-sm" draggable onDragStart={(e) => onDragStart(l.id, e)}>
                    <span className="truncate">{l.title}</span>
                    <span className="text-xs text-gray-500">{l.slug}</span>
                  </li>
                ))}
                {c.unassigned.length === 0 && <div className="text-xs text-gray-500">Drop here to keep lesson uncategorized.</div>}
              </ul>
            </div>

            {/* Chapters */}
            <div className="space-y-3">
              {c.chapters.map((ch) => (
                <div key={ch.id}
                     className="rounded-xl border border-gray-200 bg-gray-50/50 p-2"
                     onDragOver={allowDrop}
                     onDrop={(e) => onDropTo(c.id, ch.id, e)}
                >
                  <div className="mb-1 text-sm font-semibold text-gray-800">{ch.title}</div>
                  <ul className="space-y-1">
                    {ch.lessons.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-2 rounded-md border bg-white px-2 py-1 text-sm shadow-sm" draggable onDragStart={(e) => onDragStart(l.id, e)}>
                        <span className="truncate">{l.title}</span>
                        <span className="text-xs text-gray-500">{l.slug}</span>
                      </li>
                    ))}
                    {ch.lessons.length === 0 && <div className="text-xs text-gray-500">Drop lessons here</div>}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

