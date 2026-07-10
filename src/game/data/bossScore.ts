/**
 * Boss of the Sauce high score: damage dealt + nuggets eaten.
 */

const STORAGE_KEY = 'cnq-boss-best-score';

export function getBestBossScore(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.floor(n);
  } catch {
    return null;
  }
}

export function computeBossScore(damageDealt: number, nuggetsEaten: number): number {
  return Math.max(0, Math.floor(damageDealt) + Math.floor(nuggetsEaten));
}

/** @returns true if this is a new best */
export function submitBossScore(damageDealt: number, nuggetsEaten: number): {
  score: number;
  isNewBest: boolean;
} {
  const score = computeBossScore(damageDealt, nuggetsEaten);
  const prev = getBestBossScore();
  const isNewBest = prev === null || score > prev;
  if (isNewBest) {
    try {
      localStorage.setItem(STORAGE_KEY, String(score));
    } catch {
      /* ignore */
    }
  }
  return { score, isNewBest };
}

export function formatBossScore(score: number | null): string {
  if (score === null) return '—';
  return String(score);
}
