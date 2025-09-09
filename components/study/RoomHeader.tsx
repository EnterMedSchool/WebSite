"use client";

import { useEffect, useMemo, useState } from "react";

export default function RoomHeader({ room, isOwner }: { room: any; isOwner: boolean }) {
  const [slug, setSlug] = useState(room.slug as string);
  const [saving, setSaving] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = useMemo(() => `${origin}/study-rooms/${slug}`, [origin, slug]);

  useEffect(() => setSlug(room.slug), [room.slug]);

  const save = async () => {
    if (!isOwner) return;
    setSaving(true);
    const res = await fetch(`/api/study/sessions/${encodeURIComponent(room.slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ slug }),
    });
    setSaving(false);
    if (!res.ok) alert("Failed to update link. Try a different slug.");
  };

  const del = async () => {
    if (!isOwner) return;
    if (!confirm("Delete this room? This cannot be undone.")) return;
    const res = await fetch(`/api/study/sessions/${encodeURIComponent(room.slug)}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) return alert("Failed to delete room.");
    window.location.href = "/study-rooms";
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold drop-shadow">{room.title}</h1>
          {isOwner && (
            <button className="rounded bg-white/15 px-3 py-1 text-sm font-semibold shadow hover:bg-white/25" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>
      <div className="p-4 text-sm">
        <label className="mb-1 block text-xs text-gray-600">Shareable Link</label>
        <div className="flex gap-2">
          <input className="flex-1 rounded border border-gray-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={link} onChange={(e) => setSlug(e.target.value.replace(origin + "/study-rooms/", ""))} readOnly={!isOwner} />
          <button className="rounded bg-indigo-600 px-3 py-2 text-white shadow hover:bg-indigo-700" onClick={() => navigator.clipboard.writeText(link)}>Copy</button>
        </div>
      </div>
    </div>
  );
}
