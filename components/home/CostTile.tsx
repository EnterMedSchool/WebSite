"use client";

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function CostTile({ city }: { city: string }) {
  const seed = hashStr(city || "city");
  const rand = (n: number) => ((seed % n) + (n / 3)) / n; // 0.33..1 range deterministic
  const rent = Math.round(450 + rand(700) * 550); // 450..1000
  const foodIdx = Math.round(70 + rand(200) * 40); // 70..110
  const transport = Math.round(20 + rand(90) * 30); // 20..50

  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm">
      <div className="text-xs font-semibold text-gray-700">Cost hints</div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-gray-700">
        <div className="rounded-lg bg-gray-50 p-2">
          <div className="text-gray-500">Rent/mo</div>
          <div className="text-sm font-semibold">€{rent}</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <div className="text-gray-500">Food index</div>
          <div className="text-sm font-semibold">{foodIdx}</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <div className="text-gray-500">Transport</div>
          <div className="text-sm font-semibold">€{transport}</div>
        </div>
      </div>
    </div>
  );
}

