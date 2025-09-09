"use client";

import { useState } from "react";
import { useStudyStore } from "@/lib/study/store";

export default function Chat() {
  const sessionId = useStudyStore((s) => s.sessionId);
  const messages = useStudyStore((s) => s.messages);
  const addMessage = useStudyStore((s) => s.addMessage);
  const myUserId = useStudyStore((s) => s.myUserId);
  const [text, setText] = useState("");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || !sessionId || !myUserId) return;
    setText("");
    const res = await fetch("/api/study/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sessionId, content }),
    });
    if (!res.ok) return;
    // Pusher will broadcast the message to all clients, including sender.
    // We rely on that and store-level de-duplication to avoid double entries.
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold">Room Chat</h2>
      <div className="mb-3 h-64 overflow-y-auto rounded border bg-white/50 p-2">
        {messages.map((m: any) => {
          const isMe = m.userId === myUserId;
          const name = m?.user?.name || m?.user?.username || `User #${m.userId}`;
          return (
            <div key={m.id} className={`mb-1 text-sm ${isMe ? "text-indigo-700" : "text-gray-800"}`}>
              <span className="opacity-60 mr-2">[{new Date(m.createdAt).toLocaleTimeString()}]</span>
              <span className="font-medium mr-1">{name}:</span>
              {m.content}
            </div>
          );
        })}
      </div>
      {myUserId ? (
        <form onSubmit={send} className="flex gap-2">
          <input className="flex-1 rounded border border-gray-300 p-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={text} onChange={(e) => setText(e.target.value)} placeholder="Message" />
          <button className="rounded bg-indigo-600 px-3 py-2 text-white shadow hover:bg-indigo-700">Send</button>
        </form>
      ) : (
        <div className="text-sm text-gray-600">Sign in to send messages.</div>
      )}
    </div>
  );
}
