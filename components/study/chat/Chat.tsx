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
      body: JSON.stringify({ sessionId, content }),
    });
    if (!res.ok) return;
    const json = await res.json();
    addMessage(json.data);
  };

  return (
    <div className="border rounded p-4">
      <h2 className="font-semibold mb-3">Room Chat</h2>
      <div className="h-64 overflow-y-auto border rounded p-2 mb-3 bg-white/50">
        {messages.map((m: any) => {
          const isMe = m.userId === myUserId;
          const name = m?.user?.name || m?.user?.username || `User #${m.userId}`;
          return (
            <div key={m.id} className={`text-sm mb-1 ${isMe ? "text-blue-700" : "text-gray-800"}`}>
              <span className="opacity-60 mr-2">[{new Date(m.createdAt).toLocaleTimeString()}]</span>
              <span className="font-medium mr-1">{name}:</span>
              {m.content}
            </div>
          );
        })}
      </div>
      {myUserId ? (
        <form onSubmit={send} className="flex gap-2">
          <input className="flex-1 border rounded p-2" value={text} onChange={(e) => setText(e.target.value)} placeholder="Message" />
          <button className="border rounded px-3">Send</button>
        </form>
      ) : (
        <div className="text-sm text-gray-600">Sign in to send messages.</div>
      )}
    </div>
  );
}
