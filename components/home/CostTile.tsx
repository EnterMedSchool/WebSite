"use client";

export default function CostTile({ city, rent, foodIndex, transport }: { city?: string; rent?: number | null; foodIndex?: number | null; transport?: number | null }) {
  const display = (n?: number | null, prefix?: string) =>
    typeof n === "number" && !isNaN(n) ? `${prefix ?? ''}${n}` : "N/A";

  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm">
      <div className="text-xs font-semibold text-gray-700">Cost hints</div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-gray-700">
        <div className="rounded-lg bg-gray-50 p-2">
          <div className="text-gray-500">Rent/mo</div>
          <div className="text-sm font-semibold">{display(rent, "€")}</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <div className="text-gray-500">Food index</div>
          <div className="text-sm font-semibold">{display(foodIndex)}</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <div className="text-gray-500">Transport</div>
          <div className="text-sm font-semibold">{display(transport, "€")}</div>
        </div>
      </div>
    </div>
  );
}
