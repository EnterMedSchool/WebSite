"use client";

import { useEffect } from "react";
import { StudyEvents } from "@/lib/study/events";
import { useStudyStore } from "@/lib/study/store";

export function useStudyChannel(slug: string | null) {
  const addMessage = useStudyStore((s) => s.addMessage);
  const addParticipant = useStudyStore((s) => s.addParticipant);
  const removeParticipant = useStudyStore((s) => s.removeParticipant);
  const setSharedEndAt = useStudyStore((s) => s.setSharedEndAt);

  useEffect(() => {
    if (!slug) return;
    const es = new EventSource(`/api/study/sse/${encodeURIComponent(slug)}`);
    const onMsg = (e: MessageEvent) => { try { addMessage(JSON.parse(e.data)); } catch {} };
    const onJoin = (e: MessageEvent) => { try {
      const payload = JSON.parse(e.data);
      const p = { id: Number(payload?.userId), name: payload?.name ?? undefined, image: payload?.image ?? undefined, username: payload?.username ?? undefined };
      addParticipant(p);
    } catch {} };
    const onLeave = (e: MessageEvent) => { try { const p = JSON.parse(e.data); removeParticipant(Number(p?.userId)); } catch {} };
    const onTick = (e: MessageEvent) => { try { const p = JSON.parse(e.data); setSharedEndAt(p?.sharedEndAt ?? null); } catch {} };

    es.addEventListener(StudyEvents.MessageNew, onMsg);
    es.addEventListener(StudyEvents.PresenceJoin, onJoin);
    es.addEventListener(StudyEvents.PresenceLeave, onLeave);
    es.addEventListener(StudyEvents.TimerTick, onTick);

    return () => {
      es.removeEventListener(StudyEvents.MessageNew, onMsg as any);
      es.removeEventListener(StudyEvents.PresenceJoin, onJoin as any);
      es.removeEventListener(StudyEvents.PresenceLeave, onLeave as any);
      es.removeEventListener(StudyEvents.TimerTick, onTick as any);
      es.close();
    };
  }, [slug, addMessage, addParticipant, removeParticipant, setSharedEndAt]);
}
