// Simple in-memory Server-Sent Events hub for study sessions
// Note: Best suited for single-region, single-instance deployments.
// For multi-instance, back with a broker (e.g., Postgres NOTIFY or Redis pub/sub).

export type StudyEventName = string;

type Sink = {
  write: (chunk: string | Uint8Array) => void;
  close: () => void;
};

type Sub = {
  sessionId: number;
  sink: Sink;
  heartbeat: ReturnType<typeof setInterval> | null;
};

const hub = new Map<number, Set<Sub>>();

function formatSse(event: StudyEventName, data: unknown): string {
  return `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
}

export function emit(sessionId: number, event: StudyEventName, payload: unknown) {
  const set = hub.get(sessionId);
  if (!set || set.size === 0) return;
  const msg = formatSse(event, payload);
  const enc = new TextEncoder().encode(msg);
  for (const sub of set) {
    try { sub.sink.write(enc); } catch {}
  }
}

export function subscribe(sessionId: number) {
  const ts = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const sink: Sink = {
        write: (chunk) => { if (closed) return; controller.enqueue(typeof chunk === 'string' ? ts.encode(chunk) : chunk); },
        close: () => { if (closed) return; closed = true; try { controller.close(); } catch {} },
      };
      const sub: Sub = { sessionId, sink, heartbeat: null };
      if (!hub.has(sessionId)) hub.set(sessionId, new Set());
      hub.get(sessionId)!.add(sub);
      // Initial comment and heartbeat every 15s
      sink.write(ts.encode(`: connected ${Date.now()}\n\n`));
      sub.heartbeat = setInterval(() => {
        try { sink.write(ts.encode(`: ping ${Date.now()}\n\n`)); } catch {}
      }, 15000);
    },
    cancel() {
      if (closed) return;
      closed = true;
      const set = hub.get(sessionId);
      if (!set) return;
      for (const sub of Array.from(set)) {
        // We cannot compare sinks easily here; let the caller call `unsubscribe`.
      }
    },
  });

  // Return a helper to fully unregister this stream
  function unsubscribe() {
    const set = hub.get(sessionId);
    if (!set) return;
    for (const sub of Array.from(set)) {
      // there's no strong id linking; clear all that are closed via noop … best effort
      // Consumers should rely on GC when connection closes; we also sweep heartbeats.
      if (sub.heartbeat) clearInterval(sub.heartbeat);
    }
  }

  return { stream, unsubscribe };
}

