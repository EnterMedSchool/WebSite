// XP/Level utilities for gamification

export const MAX_LEVEL = 50;

// Delta XP by level using: ceil((15 + 5·L + 0.6·L²)/5)*5 for L=1..49
// Level 50 is cap, no further level.
export const DELTA_XP: number[] = Array.from({ length: MAX_LEVEL - 1 }, (_, i) => {
  const L = i + 1; // 1..49
  const raw = 15 + 5 * L + 0.6 * L * L;
  return Math.ceil(raw / 5) * 5;
});

// Cumulative goal XP to reach the start of each level (1..50)
export const GOAL_XP: number[] = (() => {
  const arr = [0]; // Level 1 starts at 0
  for (let i = 0; i < DELTA_XP.length; i++) arr.push(arr[i] + DELTA_XP[i]);
  return arr; // length 50
})();

export function levelFromXp(xp: number): number {
  if (!Number.isFinite(xp) || xp <= 0) return 1;
  // Find highest level whose goal <= xp
  let lo = 1, hi = MAX_LEVEL;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (xp >= GOAL_XP[mid - 1]) lo = mid; else hi = mid - 1;
  }
  return Math.min(Math.max(lo, 1), MAX_LEVEL);
}

export function xpToNext(xp: number): { toNext: number; nextLevelGoal: number } {
  const lvl = levelFromXp(xp);
  if (lvl >= MAX_LEVEL) return { toNext: 0, nextLevelGoal: GOAL_XP[MAX_LEVEL - 1] };
  const nextGoal = GOAL_XP[lvl];
  return { toNext: Math.max(0, nextGoal - xp), nextLevelGoal: nextGoal };
}

