"use client";

import PusherClient from "pusher-js";

let client: PusherClient | null = null;

export function getPusherClient() {
  if (client) return client;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || "";
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "";
  if (!key || !cluster) return null;
  client = new PusherClient(key, { cluster, forceTLS: true });
  return client;
}

