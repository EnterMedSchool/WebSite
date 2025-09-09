"use client";

import { create } from "zustand";

type Participant = { id: number; name?: string | null; image?: string | null; username?: string | null };
type Message = { id: number; userId: number; content: string; createdAt: string };
type TaskItem = { id: number; name: string; isCompleted: boolean; xpAwarded?: boolean };
type TaskList = { id: number; title: string; userId: number; items: TaskItem[]; updatedAt?: string | null };

type StudyState = {
  sessionId: number | null;
  slug: string | null;
  sharedEndAt: string | null;
  participants: Participant[];
  messages: Message[];
  myUserId: number | null;
  taskLists: TaskList[];
  setSession: (s: { sessionId: number; slug: string; sharedEndAt: string | null; myUserId: number | null }) => void;
  setParticipants: (p: Participant[]) => void;
  mergeParticipants: (p: Participant[]) => void;
  addParticipant: (p: Participant | { id: number }) => void;
  removeParticipant: (userId: number) => void;
  prependMessages: (ms: Message[]) => void;
  addMessage: (m: Message) => void;
  setTaskLists: (lists: TaskList[]) => void;
  upsertTaskList: (list: TaskList) => void;
  deleteTaskList: (id: number) => void;
  setSharedEndAt: (iso: string | null) => void;
};

export const useStudyStore = create<StudyState>((set) => ({
  sessionId: null,
  slug: null,
  sharedEndAt: null,
  participants: [],
  messages: [],
  myUserId: null,
  taskLists: [],
  setSession: (s) => set({ sessionId: s.sessionId, slug: s.slug, sharedEndAt: s.sharedEndAt, myUserId: s.myUserId }),
  setParticipants: (p) => set({ participants: p }),
  mergeParticipants: (incoming) => set((st) => {
    const byId = new Map<number, Participant>();
    st.participants.forEach((x) => byId.set(x.id, x));
    incoming.forEach((x) => {
      const prev = byId.get(x.id) || { id: x.id } as Participant;
      byId.set(x.id, { ...prev, ...x });
    });
    return { participants: Array.from(byId.values()) } as any;
  }),
  addParticipant: (p) => set((st) => ({ participants: st.participants.some((x) => x.id === (p as any).id) ? st.participants : [...st.participants, p as any] })),
  removeParticipant: (userId) => set((st) => ({ participants: st.participants.filter((p) => p.id !== userId) })),
  prependMessages: (ms) => set((st) => ({ messages: [...ms, ...st.messages] })),
  addMessage: (m) => set((st) => ({ messages: st.messages.some((x) => x.id === (m as any).id) ? st.messages : [...st.messages, m] })),
  setTaskLists: (lists) => set({ taskLists: lists }),
  upsertTaskList: (incoming) => set((st) => {
    const idx = st.taskLists.findIndex((x) => x.id === incoming.id);
    if (idx === -1) return { taskLists: [incoming, ...st.taskLists] } as any;
    const current = st.taskLists[idx];
    const curTs = current.updatedAt ? Date.parse(current.updatedAt) : 0;
    const inTs = incoming.updatedAt ? Date.parse(incoming.updatedAt) : Number.MAX_SAFE_INTEGER; // prefer incoming when missing cur ts
    if (inTs >= curTs) {
      const copy = st.taskLists.slice();
      copy[idx] = incoming;
      return { taskLists: copy } as any;
    }
    return { taskLists: st.taskLists } as any;
  }),
  deleteTaskList: (id) => set((st) => ({ taskLists: st.taskLists.filter((x) => x.id !== id) })),
  setSharedEndAt: (iso) => set({ sharedEndAt: iso }),
}));
