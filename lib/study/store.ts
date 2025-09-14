"use client";

// Simple local-first store for pending study actions per course.
// Keeps data in localStorage and syncs count across tabs via BroadcastChannel.

export type QuestionStatus = "correct" | "incorrect";

type Pending = {
  lessons_completed: number[]; // lesson ids
  lessons_incomplete?: number[]; // lesson ids to undo completion
  question_status: [number, QuestionStatus][]; // [question_id, status]
  lastSavedHash?: string; // for autosave diffing
  updatedAt?: number;
  lastSavedAt?: number; // unix ms
};

const CH = typeof window !== "undefined" ? new BroadcastChannel("ems-study-sync") : null;

function key(courseId: number) {
  return `ems:study:pending:${courseId}`;
}

function load(courseId: number): Pending {
  try {
    const raw = localStorage.getItem(key(courseId));
    if (!raw) return { lessons_completed: [], question_status: [] };
    const j = JSON.parse(raw);
    return {
      lessons_completed: Array.isArray(j.lessons_completed) ? j.lessons_completed.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n)) : [],
      lessons_incomplete: Array.isArray(j.lessons_incomplete) ? j.lessons_incomplete.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n)) : [],
      question_status: Array.isArray(j.question_status) ? j.question_status.map((a: any) => [Number(a[0]), String(a[1]) as QuestionStatus]).filter((a: any) => Number.isFinite(a[0])) : [],
      lastSavedHash: j.lastSavedHash,
      updatedAt: Number(j.updatedAt || Date.now()),
    };
  } catch {
    return { lessons_completed: [], question_status: [] };
  }
}

function save(courseId: number, data: Pending) {
  // Merge with latest stored to avoid cross-tab lost updates
  const cur = load(courseId);
  const mergeSet = (a: number[] | undefined, b: number[] | undefined) => {
    const s = new Set<number>();
    (a || []).forEach((n) => s.add(n));
    (b || []).forEach((n) => s.add(n));
    return Array.from(s);
  };
  const mergedCompleted = mergeSet(cur.lessons_completed, data.lessons_completed);
  const mergedIncomplete = mergeSet(cur.lessons_incomplete || [], data.lessons_incomplete || []);
  // Ensure undo wins locally: remove any completed that are also in incomplete
  const liSet = new Set<number>(mergedIncomplete);
  const lc = mergedCompleted.filter((id) => !liSet.has(id));

  // Merge question statuses by id, favoring newest payload
  const map = new Map<number, QuestionStatus>();
  for (const [id, st] of cur.question_status) map.set(id, st);
  for (const [id, st] of data.question_status) map.set(id, st);
  const qarr: [number, QuestionStatus][] = Array.from(map.entries());

  const next: Pending = {
    lessons_completed: lc,
    lessons_incomplete: mergedIncomplete,
    question_status: qarr,
    lastSavedHash: cur.lastSavedHash,
    updatedAt: Date.now(),
    lastSavedAt: cur.lastSavedAt,
  };
  localStorage.setItem(key(courseId), JSON.stringify(next));
  const c = (lc.length + (mergedIncomplete?.length || 0) + qarr.length);
  for (const l of listeners) try { l(courseId, c); } catch {}
  CH?.postMessage({ type: "pending:update", courseId, count: c });
}

function count(courseId: number): number {
  const p = load(courseId);
  return (p.lessons_completed.length + (p.lessons_incomplete?.length || 0) + p.question_status.length);
}

type Listener = (courseId: number, pendingCount: number) => void;
const listeners = new Set<Listener>();

if (CH) {
  CH.onmessage = (ev) => {
    const msg = ev.data || {};
    if (msg?.type === "pending:update") {
      for (const l of listeners) l(msg.courseId, msg.count);
    }
  };
}

export const StudyStore = {
  getPending(courseId: number): Pending {
    return load(courseId);
  },
  getPendingCount(courseId: number): number {
    return count(courseId);
  },
  getPendingHash(courseId: number): string {
    const p = load(courseId);
    try {
      return JSON.stringify({
        l: p.lessons_completed.slice().sort((a,b)=>a-b),
        li: (p.lessons_incomplete||[]).slice().sort((a,b)=>a-b),
        q: p.question_status.slice().sort((a,b)=>a[0]-b[0])
      });
    } catch {
      return `${p.lessons_completed.length}:${(p.lessons_incomplete?.length||0)}:${p.question_status.length}`;
    }
  },
  markSaved(courseId: number, hash: string) {
    const p = load(courseId);
    p.lastSavedHash = hash;
    p.lastSavedAt = Date.now();
    save(courseId, p);
  },
  getLastSavedAt(courseId: number): number | null { return load(courseId).lastSavedAt || null; },
  addLessonComplete(courseId: number, lessonId: number) {
    if (!courseId || !lessonId) return;
    const p = load(courseId);
    if (!p.lessons_completed.includes(lessonId)) p.lessons_completed.push(lessonId);
    // remove any pending undo for this lesson
    p.lessons_incomplete = (p.lessons_incomplete || []).filter((id) => id !== lessonId);
    save(courseId, p);
  },
  removeLessonComplete(courseId: number, lessonId: number) {
    if (!courseId || !lessonId) return;
    const p = load(courseId);
    // remove pending complete if it exists
    p.lessons_completed = p.lessons_completed.filter((id) => id !== lessonId);
    const li = new Set(p.lessons_incomplete || []);
    li.add(lessonId);
    p.lessons_incomplete = Array.from(li);
    save(courseId, p);
  },
  addQuestionStatus(courseId: number, questionId: number, status: QuestionStatus) {
    if (!courseId || !questionId) return;
    const p = load(courseId);
    // replace any previous entry for the question
    p.question_status = p.question_status.filter(([id]) => id !== questionId);
    p.question_status.push([questionId, status]);
    save(courseId, p);
  },
  clear(courseId: number) {
    localStorage.removeItem(key(courseId));
    // Notify both local and cross-tab listeners
    for (const l of listeners) try { l(courseId, 0); } catch {}
    CH?.postMessage({ type: "pending:update", courseId, count: 0 });
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
