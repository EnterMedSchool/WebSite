"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewStudyRoomPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/study/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    setLoading(false);
    if (!res.ok) return alert("Failed to create. Please sign in and try again.");
    const json = await res.json();
    router.push(`/study-rooms/${json.data.slug}`);
  };

  return (
    <section className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6">Create Study Room</h1>
      <form onSubmit={create} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input className="w-full border rounded p-2" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea className="w-full border rounded p-2" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button className="border rounded px-4 py-2" disabled={loading}>{loading ? "Creating..." : "Create"}</button>
      </form>
    </section>
  );
}

