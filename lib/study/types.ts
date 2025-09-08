export type StudySession = {
  id: number;
  creatorUserId: number;
  title: string;
  description: string | null;
  slug: string;
  sharedEndAt: string | null; // ISO
  totalJoins: number;
  createdAt: string; // ISO
};

export type StudyMessage = {
  id: number;
  sessionId: number;
  userId: number;
  content: string;
  createdAt: string; // ISO
};

export type StudyTaskItem = {
  id: number;
  taskListId: number;
  name: string;
  isCompleted: boolean;
  createdAt: string; // ISO
};

export type StudyTaskList = {
  id: number;
  sessionId: number;
  userId: number;
  title: string;
  createdAt: string; // ISO
  items?: StudyTaskItem[];
};

