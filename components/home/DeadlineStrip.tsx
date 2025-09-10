"use client";

export default function DeadlineStrip({ opens = "May", deadline = "July", results = "September" }: { opens?: string; deadline?: string; results?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm">
      <div className="text-xs font-semibold text-gray-700">Admissions timeline</div>
      <div className="mt-2 flex items-center gap-3">
        {[
          { label: "Opens", val: opens },
          { label: "Deadline", val: deadline },
          { label: "Results", val: results },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="text-left">
              <div className="text-[10px] font-semibold text-gray-500">{s.label}</div>
              <div className="text-sm font-medium text-gray-900">{s.val}</div>
            </div>
            {i < 2 && <div className="h-[2px] w-8 rounded bg-gradient-to-r from-indigo-300 to-violet-300" />}
          </div>
        ))}
      </div>
    </div>
  );
}

