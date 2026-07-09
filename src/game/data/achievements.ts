/**
 * Achievement definitions + localStorage persistence.
 * Add new achievements to ACHIEVEMENTS (keep exactly 10 slots).
 */

export type AchievementId =
  | 'mc_bummer'
  | 'saucy'
  | 'ten_piece'
  | 'twenty_piece'
  | 'get_your_steps_in'
  | 'want_fries'
  | 'combo_meal'
  | 'skinny'
  | 'ketchup'
  | 'hungry';

export interface AchievementDef {
  id: AchievementId;
  /** Full title, e.g. "McBummer - You Died" */
  name: string;
  description: string;
  /** Texture key when unlocked (generated in Boot). */
  iconKey: string;
  /** When true, name is hidden as ??? until unlocked. */
  hiddenUntilUnlocked?: boolean;
  /** Placeholder slots not yet designed. */
  placeholder?: boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'mc_bummer',
    name: 'McBummer - You Died',
    description: 'Die during a run. It happens to the best of us.',
    iconKey: 'ach_mc_bummer',
  },
  {
    id: 'saucy',
    name: 'Saucy - Get all 3 sauces and die',
    description: 'Collect WeakSauce, BBQ, and AwesomeSauce… then expire anyway.',
    iconKey: 'ach_saucy',
  },
  {
    id: 'ten_piece',
    name: '10-piece - Get 10 nuggets in a single game',
    description: 'Eat 10 nuggets in one run. Counter resets on win or death.',
    iconKey: 'ach_ten_piece',
  },
  {
    id: 'twenty_piece',
    name: '20-piece - Get 20 nuggets in a single game',
    description: 'Eat 20 nuggets in one run. Counter resets on win or death.',
    iconKey: 'ach_twenty_piece',
  },
  {
    id: 'get_your_steps_in',
    name: 'Get Your Steps In',
    description: 'Take over 100 steps in one run. Counter resets on win or death.',
    iconKey: 'ach_get_your_steps_in',
  },
  {
    id: 'want_fries',
    name: 'Want Fries with That?',
    description: 'Get killed by a Vengeful Fry.',
    iconKey: 'ach_want_fries',
  },
  {
    id: 'combo_meal',
    name: 'Combo Meal',
    description:
      'Defeat one of each enemy type in a single run. Resets on death or win.',
    iconKey: 'ach_combo_meal',
  },
  {
    id: 'skinny',
    name: 'Skinny',
    description: 'Win a round (floor) without eating a single nugget.',
    iconKey: 'ach_skinny',
  },
  {
    id: 'ketchup',
    name: 'Ketchup',
    description:
      'Beat an existing best-steps score. Only after a low score has already been set.',
    iconKey: 'ach_ketchup',
  },
  {
    id: 'hungry',
    name: 'Hungry',
    description: 'Play 10 runs (win or lose).',
    iconKey: 'ach_hungry',
  },
];

const STORAGE_KEY = 'cnq-achievements';
const RUNS_PLAYED_KEY = 'cnq-runs-played';
const DEATHS_KEY = 'cnq-deaths';
const HUNGRY_RUNS_REQUIRED = 10;

function readStore(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function writeStore(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore quota / private mode */
  }
}

export function isAchievementUnlocked(id: AchievementId): boolean {
  return readStore().has(id);
}

export function getUnlockedAchievementIds(): AchievementId[] {
  const store = readStore();
  return ACHIEVEMENTS.map((a) => a.id).filter((id) => store.has(id));
}

/**
 * Unlock an achievement if not already earned.
 * @returns true if this call newly unlocked it
 */
export function unlockAchievement(id: AchievementId): boolean {
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (!def || def.placeholder) return false;
  const store = readStore();
  if (store.has(id)) return false;
  store.add(id);
  writeStore(store);
  return true;
}

export function getRunsPlayed(): number {
  try {
    const n = Number(localStorage.getItem(RUNS_PLAYED_KEY));
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.floor(n);
  } catch {
    return 0;
  }
}

/**
 * Call once when a run ends (win or lose). Returns true if Hungry newly unlocked.
 */
export function recordRunPlayed(): boolean {
  const next = getRunsPlayed() + 1;
  try {
    localStorage.setItem(RUNS_PLAYED_KEY, String(next));
  } catch {
    /* ignore */
  }
  if (next >= HUNGRY_RUNS_REQUIRED) {
    return unlockAchievement('hungry');
  }
  return false;
}

export function getDeaths(): number {
  try {
    const n = Number(localStorage.getItem(DEATHS_KEY));
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.floor(n);
  } catch {
    return 0;
  }
}

/** Call once when a run ends in death (not victory). */
export function recordDeath(): number {
  const next = getDeaths() + 1;
  try {
    localStorage.setItem(DEATHS_KEY, String(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function getAchievement(id: AchievementId): AchievementDef {
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (!def) throw new Error(`Unknown achievement: ${id}`);
  return def;
}

export function displayName(def: AchievementDef, unlocked: boolean): string {
  if (!unlocked && def.hiddenUntilUnlocked) return '???';
  return def.name;
}
