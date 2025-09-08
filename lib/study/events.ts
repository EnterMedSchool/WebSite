export const STUDY_CHANNEL_PREFIX = "study-session-";

export function channelForSession(sessionId: number | string) {
  return `${STUDY_CHANNEL_PREFIX}${sessionId}`;
}

// Standardized event names
export const StudyEvents = {
  PresenceJoin: "presence:join",
  PresenceLeave: "presence:leave",
  MessageNew: "message:new",
  TimerTick: "timer:tick",
  TaskUpsert: "task:upsert",
  TaskDelete: "task:delete",
} as const;

export type StudyEventName = (typeof StudyEvents)[keyof typeof StudyEvents];

