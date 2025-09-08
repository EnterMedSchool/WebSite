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
    <div className="border rounded p-4 mb-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{room.title}</h1>
        {isOwner && (
          <div className="flex gap-2">
            <button className="border rounded px-3 py-1" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            <button className="border rounded px-3 py-1 text-red-600" onClick={del}>Delete</button>
          </div>
        )}
      </div>
      <div className="mt-2 text-sm">
        <label className="block text-xs mb-1">Shareable Link</label>
        <div className="flex gap-2">
          <input className="flex-1 border rounded p-2" value={link} onChange={(e) => setSlug(e.target.value.replace(origin + "/study-rooms/", ""))} readOnly={!isOwner} />
          <button className="border rounded px-3" onClick={() => navigator.clipboard.writeText(link)}>Copy</button>
        </div>
      </div>
    </div>
  );
}
