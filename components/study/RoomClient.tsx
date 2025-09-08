"use client";

import { useEffect, useMemo, useState } from "react";
import { useStudyStore } from "@/lib/study/store";
import { useStudyChannel } from "@/lib/study/useChannel";
import Participants from "@/components/study/Participants";
import Chat from "@/components/study/chat/Chat";
import MyTasks from "@/components/study/tasks/MyTasks";
import Timer from "@/components/study/timer/Timer";
import RoomHeader from "@/components/study/RoomHeader";
import OthersTasks from "@/components/study/tasks/OthersTasks";

export default function RoomClient({ room, messages, taskLists, myUserId }: { room: any; messages: any[]; taskLists: any[]; myUserId: number | null; }) {
  const setSession = useStudyStore((s) => s.setSession);
  const setParticipants = useStudyStore((s) => s.setParticipants);
  const prependMessages = useStudyStore((s) => s.prependMessages);
  const setTaskLists = useStudyStore((s) => s.setTaskLists);

  const sessionId = room?.id ? Number(room.id) : null;
  useStudyChannel(sessionId);

  useEffect(() => {
    setSession({ sessionId: Number(room.id), slug: room.slug, sharedEndAt: room.sharedEndAt, myUserId });
    prependMessages(messages?.slice().reverse() || []);
    setTaskLists((taskLists || []).map((l: any) => ({ id: l.id, title: l.title, userId: l.userId, items: (l.items || []).map((it: any) => ({ id: it.id, name: it.name, isCompleted: it.isCompleted })) })));
  }, [room, messages, taskLists, myUserId, setSession, prependMessages, setTaskLists]);

  // On mount: join; before unload: leave; fetch participants
  useEffect(() => {
    if (!sessionId) return;
    const join = async () => { await fetch(`/api/study/sessions/${encodeURIComponent(room.slug)}/join`, { method: "PATCH" }); };
    const leave = async () => { await fetch(`/api/study/sessions/${encodeURIComponent(room.slug)}/leave`, { method: "PATCH" }); };
    const loadParticipants = async () => {
      const res = await fetch(`/api/study/sessions/${encodeURIComponent(room.slug)}/participants`);
      if (res.ok) {
        const json = await res.json();
        useStudyStore.getState().setParticipants((json.data || []).map((p: any) => ({ id: p.id, name: p.name, image: p.image, username: p.username })));
      }
    };
    join();
    loadParticipants();
    const handler = () => { void leave(); };
    window.addEventListener("beforeunload", handler);
    return () => { window.removeEventListener("beforeunload", handler); void leave(); };
  }, [sessionId, setParticipants]);

  const isOwner = myUserId != null && Number(myUserId) === Number(room.creatorUserId);

  return (
    <div>
      <RoomHeader room={room} isOwner={!!isOwner} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Chat />
          <MyTasks />
          <OthersTasks />
        </div>
        <aside>
          <Timer isOwner={!!isOwner} slug={room.slug} />
          <Participants />
        </aside>
      </div>
    </div>
  );
}
