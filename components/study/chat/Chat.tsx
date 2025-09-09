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
    <div className="rounded-[28px] border border-gray-200 bg-gradient-to-b from-indigo-50 to-white p-5 shadow-xl">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
        <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M2 3h20v14H6l-4 4V3Z"/></svg>
        Room Chat
      </div>
      <div className="mb-3 h-64 overflow-y-auto rounded-2xl border border-indigo-100 bg-white/70 p-3">
        {messages.map((m: any) => {
          const isMe = m.userId === myUserId;
          const name = m?.user?.name || m?.user?.username || `User #${m.userId}`;
          return (
            <div key={m.id} className={`mb-2 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && <div className="mr-2 mt-5 h-7 w-7 shrink-0 rounded-full bg-indigo-200" />}
              <div className={`${isMe ? 'bg-indigo-600 text-white rounded-t-2xl rounded-bl-2xl' : 'bg-white text-gray-800 border border-indigo-100 rounded-t-2xl rounded-br-2xl'} max-w-[78%] p-2 shadow-sm` }>
                <div className={`text-[11px] ${isMe ? 'text-white/80' : 'text-gray-500'} mb-0.5`}>{name} • {new Date(m.createdAt).toLocaleTimeString()}</div>
                <div className="text-sm leading-snug whitespace-pre-wrap break-words">{m.content}</div>
              </div>
              {isMe && <div className="ml-2 mt-5 h-7 w-7 shrink-0 rounded-full bg-indigo-200" />}
            </div>
          );
        })}
      </div>
      {myUserId ? (
        <form onSubmit={send} className="flex gap-2">
          <input className="flex-1 rounded-2xl border border-gray-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" />
          <button className="rounded-2xl bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700">Send</button>
        </form>
      ) : (
        <div className="text-sm text-gray-600">Sign in to send messages.</div>
      )}
    </div>
  );
}
