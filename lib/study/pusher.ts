import Pusher from "pusher";
import { channelForSession } from "@/lib/study/events";

// Initialize Pusher server instance if env is present.
const {
  PUSHER_APP_ID,
  PUSHER_KEY,
  PUSHER_SECRET,
  PUSHER_CLUSTER,
} = process.env as Record<string, string | undefined>;

export const pusher =
  PUSHER_APP_ID && PUSHER_KEY && PUSHER_SECRET && PUSHER_CLUSTER
    ? new Pusher({
        appId: PUSHER_APP_ID,
        key: PUSHER_KEY,
        secret: PUSHER_SECRET,
        cluster: PUSHER_CLUSTER,
        useTLS: true,
      })
    : null;

export async function publish(
  sessionId: number | string,
  event: string,
  payload: unknown
) {
  if (!pusher) return; // no-op when not configured
  const channel = channelForSession(sessionId);
  await pusher.trigger(channel, event, payload);
}

