"use client";

export default function LessonMeta() {
  return (
    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="text-sm font-semibold text-gray-900">Lesson author</div>
        <div className="mt-1 text-sm text-gray-600">—</div>
        <div className="mt-2 text-[12px] text-gray-500">Reviewed by —</div>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="text-sm font-semibold text-gray-900">Recently completed</div>
        <div className="mt-1 flex -space-x-2 overflow-hidden">
          {[0,1,2,3,4].map((i)=> (
            <div key={i} className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-200 to-violet-200 ring-2 ring-white" />
          ))}
        </div>
        <div className="mt-2 text-[12px] text-gray-500">More classmates soon</div>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="text-sm font-semibold text-gray-900">Credits & resources</div>
        <ul className="mt-1 text-[12px] text-gray-600">
          <li>• Images, icons and references</li>
          <li>• Copyrights & licenses</li>
          <li>• External reading</li>
        </ul>
      </div>
    </div>
  );
}

