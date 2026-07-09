const STORAGE_KEY = 'cnq-best-steps';

/** Best (lowest) step count for a full clear. null = none yet. */
export function getBestSteps(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null || raw === '') return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.floor(n);
  } catch {
    return null;
  }
}

/**
 * Record a completed-run step count if it beats the best.
 * @returns true if this is a new high score (including first clear).
 */
export function tryRecordBestSteps(steps: number): boolean {
  if (!Number.isFinite(steps) || steps < 0) return false;
  const rounded = Math.floor(steps);
  const prev = getBestSteps();
  if (prev !== null && rounded >= prev) return false;
  try {
    localStorage.setItem(STORAGE_KEY, String(rounded));
  } catch {
    return false;
  }
  return true;
}

export function formatBestSteps(best: number | null): string {
  if (best === null) return '—';
  return String(best);
}
