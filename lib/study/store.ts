"use client";

import { create } from "zustand";

type Participant = { id: number; name?: string | null; image?: string | null; username?: string | null };
type Message = { id: number; userId: number; content: string; createdAt: string };
type TaskItem = { id: number; name: string; isCompleted: boolean };
type TaskList = { id: number; title: string; userId: number; items: TaskItem[] };

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
  addParticipant: (p) => set((st) => ({ participants: st.participants.some((x) => x.id === (p as any).id) ? st.participants : [...st.participants, p as any] })),
  removeParticipant: (userId) => set((st) => ({ participants: st.participants.filter((p) => p.id !== userId) })),
  prependMessages: (ms) => set((st) => ({ messages: [...ms, ...st.messages] })),
  addMessage: (m) => set((st) => ({ messages: [...st.messages, m] })),
  setTaskLists: (lists) => set({ taskLists: lists }),
  upsertTaskList: (list) => set((st) => ({ taskLists: st.taskLists.some((x) => x.id === list.id) ? st.taskLists.map((x) => (x.id === list.id ? list : x)) : [list, ...st.taskLists] })),
  deleteTaskList: (id) => set((st) => ({ taskLists: st.taskLists.filter((x) => x.id !== id) })),
  setSharedEndAt: (iso) => set({ sharedEndAt: iso }),
}));

