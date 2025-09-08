"use client";

import { useEffect } from "react";
import { getPusherClient } from "@/lib/study/pusherClient";
import { channelForSession, StudyEvents } from "@/lib/study/events";
import { useStudyStore } from "@/lib/study/store";

export function useStudyChannel(sessionId: number | null) {
  const addMessage = useStudyStore((s) => s.addMessage);
  const upsertTask = useStudyStore((s) => s.upsertTaskList);
  const deleteTask = useStudyStore((s) => s.deleteTaskList);
  const addParticipant = useStudyStore((s) => s.addParticipant);
  const removeParticipant = useStudyStore((s) => s.removeParticipant);
  const setSharedEndAt = useStudyStore((s) => s.setSharedEndAt);

  useEffect(() => {
    const client = getPusherClient();
    if (!client || !sessionId) return;
    const channel = client.subscribe(channelForSession(sessionId));
    const onMsg = (payload: any) => addMessage(payload);
    const onTask = (payload: any) => upsertTask(payload);
    const onTaskDel = (payload: any) => deleteTask(payload.taskListId);
    const onJoin = (payload: any) => addParticipant({ id: Number(payload?.userId) });
    const onLeave = (payload: any) => removeParticipant(Number(payload?.userId));
    const onTick = (payload: any) => setSharedEndAt(payload?.sharedEndAt ?? null);

    channel.bind(StudyEvents.MessageNew, onMsg);
    channel.bind(StudyEvents.TaskUpsert, onTask);
    channel.bind(StudyEvents.TaskDelete, onTaskDel);
    channel.bind(StudyEvents.PresenceJoin, onJoin);
    channel.bind(StudyEvents.PresenceLeave, onLeave);
    channel.bind(StudyEvents.TimerTick, onTick);

    return () => {
      channel.unbind(StudyEvents.MessageNew, onMsg);
      channel.unbind(StudyEvents.TaskUpsert, onTask);
      channel.unbind(StudyEvents.TaskDelete, onTaskDel);
      channel.unbind(StudyEvents.PresenceJoin, onJoin);
      channel.unbind(StudyEvents.PresenceLeave, onLeave);
      channel.unbind(StudyEvents.TimerTick, onTick);
      client.unsubscribe(channelForSession(sessionId));
    };
  }, [sessionId, addMessage, upsertTask, deleteTask, addParticipant, removeParticipant, setSharedEndAt]);
}

