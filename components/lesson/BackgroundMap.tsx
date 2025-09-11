"use client";

export default function BackgroundMap() {
  // Simple mini mind-map using SVG
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="mb-2 text-sm font-semibold text-indigo-900">Background knowledge</div>
      <div className="text-[12px] text-gray-600">A high-level path to this lesson</div>
      <div className="mt-3 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-sky-50">
        <svg viewBox="0 0 400 200" className="block w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#6366f1" />
            </marker>
          </defs>
          <g stroke="#a5b4fc" strokeWidth="2" fill="none" markerEnd="url(#arrow)">
            <path d="M90 100 C 120 60, 160 60, 190 100" />
            <path d="M210 100 C 240 140, 280 140, 310 100" />
          </g>
          <g>
            <circle cx="80" cy="100" r="18" fill="#eef2ff" stroke="#c7d2fe" />
            <text x="80" y="104" textAnchor="middle" fontSize="10" fill="#3730a3">Basics</text>
          </g>
          <g>
            <circle cx="200" cy="100" r="20" fill="#e0e7ff" stroke="#c7d2fe" />
            <text x="200" y="88" textAnchor="middle" fontSize="10" fill="#3730a3">Coag.</text>
            <text x="200" y="104" textAnchor="middle" fontSize="9" fill="#3730a3">Pathways</text>
          </g>
          <g>
            <circle cx="320" cy="100" r="22" fill="#c7d2fe" stroke="#a5b4fc" />
            <text x="320" y="104" textAnchor="middle" fontSize="10" fill="#1e1b4b">DIC</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

