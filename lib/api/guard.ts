import { NextResponse } from 'next/server';

type GuardState = {
  tokens: number;
  lastRefill: number;
  inFlight: number;
  breakerOpenUntil: number;
  dropWindowStart: number;
  dropCount: number;
};

type GuardOptions = {
  key?: string; // informational only
};

const key = '__API_GUARD_STATE__';
// @ts-ignore
const g: any = globalThis as any;
if (!g[key]) {
  g[key] = {
    tokens: 0,
    lastRefill: Date.now(),
    inFlight: 0,
    breakerOpenUntil: 0,
    dropWindowStart: Date.now(),
    dropCount: 0,
  } as GuardState;
}

function getCfg() {
  const enabled = String(process.env.API_THROTTLE ?? '1') !== '0';
  const MAX_RPS = Number(process.env.API_MAX_RPS ?? 200);
  const BURST = Number(process.env.API_BURST ?? Math.max(400, MAX_RPS * 2));
  const MAX_CONCURRENT = Number(process.env.API_MAX_CONCURRENT ?? 64);
  const BREAKER_ENABLED = String(process.env.API_BREAKER_ENABLED ?? '1') !== '0';
  const BREAKER_WINDOW_MS = Number(process.env.API_BREAKER_WINDOW_MS ?? 2000);
  const BREAKER_TRIGGER_DROPS = Number(process.env.API_BREAKER_TRIGGER_DROPS ?? 100);
  const BREAKER_OPEN_SECS = Number(process.env.API_BREAKER_OPEN_SECS ?? 10);
  return {
    enabled,
    MAX_RPS,
    BURST,
    MAX_CONCURRENT,
    BREAKER_ENABLED,
    BREAKER_WINDOW_MS,
    BREAKER_TRIGGER_DROPS,
    BREAKER_OPEN_SECS,
  };
}

function tooMany(reason: 'throttle' | 'concurrency' | 'breaker', path?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Retry-After': reason === 'breaker' ? String(getCfg().BREAKER_OPEN_SECS) : '1',
  };
  if (reason === 'throttle') headers['X-Api-Throttle'] = '1';
  if (reason === 'concurrency') headers['X-Api-Concurrency'] = '1';
  if (reason === 'breaker') headers['X-Api-Breaker'] = '1';
  if (path) headers['X-Throttle-Path'] = path;
  return new NextResponse(
    JSON.stringify({ error: 'too_many_requests', reason }),
    { status: 429, headers },
  );
}

export function apiGuardStart(req: Request, opts?: GuardOptions): { deny?: NextResponse; end: () => void } {
  const cfg = getCfg();
  const state: GuardState = g[key];
  const pathname = (() => { try { return new URL(req.url).pathname; } catch { return undefined; } })();

  if (!cfg.enabled) return { end: () => {} };

  const now = Date.now();

  // Circuit breaker
  if (cfg.BREAKER_ENABLED && now < state.breakerOpenUntil) {
    return { deny: tooMany('breaker', pathname), end: () => {} };
  }

  // Refill tokens
  if (state.tokens === 0 && state.lastRefill === 0) {
    state.tokens = cfg.BURST;
    state.lastRefill = now;
  }
  const delta = Math.max(0, now - state.lastRefill);
  const refill = (delta / 1000) * cfg.MAX_RPS;
  state.tokens = Math.min(cfg.BURST, state.tokens + refill);
  state.lastRefill = now;

  // Concurrency check
  if (state.inFlight >= cfg.MAX_CONCURRENT) {
    registerDrop(now, cfg, state);
    return { deny: tooMany('concurrency', pathname), end: () => {} };
  }

  // Token check
  if (state.tokens < 1) {
    registerDrop(now, cfg, state);
    return { deny: tooMany('throttle', pathname), end: () => {} };
  }

  // Accept: consume one token and increment in-flight
  state.tokens -= 1;
  state.inFlight += 1;

  let ended = false;
  function end() {
    if (ended) return;
    ended = true;
    state.inFlight = Math.max(0, state.inFlight - 1);
  }

  return { end };
}

function registerDrop(now: number, cfg: ReturnType<typeof getCfg>, state: GuardState) {
  // Sliding window drop counter
  if (now - state.dropWindowStart > cfg.BREAKER_WINDOW_MS) {
    state.dropWindowStart = now;
    state.dropCount = 0;
  }
  state.dropCount += 1;
  if (cfg.BREAKER_ENABLED && state.dropCount >= cfg.BREAKER_TRIGGER_DROPS) {
    state.breakerOpenUntil = now + cfg.BREAKER_OPEN_SECS * 1000;
    state.dropCount = 0;
  }
}

