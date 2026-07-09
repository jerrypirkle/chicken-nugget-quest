import {
  HUNGER_HARD,
  MAX_HUNGER,
  TOTAL_FLOORS,
  type RunState,
  type RunStats,
} from './types';
import { SAUCES } from './content';

export function createEmptyStats(): RunStats {
  return {
    floorsCleared: 0,
    nuggetsEaten: 0,
    enemiesSlain: 0,
    turnsSurvived: 0,
    steps: 0,
    saucesCollected: [],
    enemyTypesSlain: [],
    causeOfDeath: null,
    victory: false,
  };
}

export interface NewRunOptions {
  seed?: number;
  /** Starting hunger (max remains MAX_HUNGER). Clamped to 1..MAX_HUNGER. */
  startingHunger?: number;
}

export function createNewRun(options: NewRunOptions = {}): RunState {
  const starting = Math.min(
    MAX_HUNGER,
    Math.max(1, options.startingHunger ?? MAX_HUNGER),
  );
  return {
    seed: options.seed ?? (Date.now() >>> 0),
    floorIndex: 0,
    hunger: starting,
    maxHunger: MAX_HUNGER,
    startingHunger: starting,
    attack: 3,
    sauces: [],
    stats: createEmptyStats(),
  };
}

/** Next-run hunger after end screen: same on loss, hardest on win. */
export function nextRunStartingHunger(run: RunState): number {
  if (run.stats.victory) return HUNGER_HARD;
  return run.startingHunger;
}

export function requiredSauceIds(): string[] {
  return SAUCES.slice(0, TOTAL_FLOORS).map((s) => s.id);
}

export function hasAllSauces(run: RunState): boolean {
  const need = requiredSauceIds();
  return need.every((id) => run.sauces.includes(id));
}

/** Simple mulberry32 PRNG from seed. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}
