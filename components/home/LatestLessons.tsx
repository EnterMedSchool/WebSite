"use client";

type Lesson = {
  id: string;
  title: string;
  thumb?: string;
  steps: number;
  questions: number;
  progress: number; // 0..100
  completed?: boolean;
};

const MOCK: Lesson[] = [
  { id: "1", title: "IMAT Biology: Cell Structure Essentials", steps: 7, questions: 24, progress: 40, thumb: undefined },
  { id: "2", title: "Chemistry Quickstart: Stoichiometry", steps: 6, questions: 18, progress: 0 },
  { id: "3", title: "Physics Fundamentals: Kinematics", steps: 8, questions: 30, progress: 70 },
  { id: "4", title: "Critical Thinking: Argument Evaluation", steps: 5, questions: 20, progress: 100, completed: true },
];

export default function LatestLessons() {
  const data = MOCK;
  return (
    <section id="lessons" className="my-10">
      <div className="mb-3 flex items-end justify-between">
        <h3 className="text-xl font-bold tracking-tight">Latest mini‑lessons</h3>
        <a href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">View all</a>
      </div>

      <div className="-mx-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-2 pb-2">
        {data.map((l) => (
          <article key={l.id} className="snap-start w-[280px] shrink-0 rounded-2xl border bg-white shadow-sm ring-1 ring-black/5">
            <div className="h-36 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-indigo-100 to-violet-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {l.thumb ? <img src={l.thumb} alt="thumb" className="h-full w-full object-cover"/> : (
                <div className="flex h-full w-full items-center justify-center text-indigo-700/70">Thumbnail</div>
              )}
            </div>
            <div className="p-3">
              <h4 className="line-clamp-2 text-sm font-semibold text-gray-900">{l.title}</h4>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <span className="rounded-full bg-gray-100 px-2 py-0.5">{l.steps} steps</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5">{l.questions} questions</span>
                {l.completed && <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-700">Completed</span>}
              </div>
              {/* progress */}
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${l.progress}%` }} />
                </div>
                <div className="mt-1 text-right text-[10px] text-gray-500">{l.progress}%</div>
              </div>
              <div className="mt-3 flex justify-between">
                <button className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700">Continue</button>
                <button className="rounded-lg border px-3 py-1 text-xs font-semibold hover:bg-gray-50">Details</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
