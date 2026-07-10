/**
 * Boss of the Sauce unlock — all 10 core achievements, or dev localStorage flag.
 */
import { areAllCoreAchievementsUnlocked } from './achievements';

const DEV_FLAG = 'cnq-boss-dev-unlock';
const INTRO_PENDING = 'cnq-boss-intro-pending';
const INTRO_DONE = 'cnq-boss-intro-done';

export function isBossDevUnlocked(): boolean {
  try {
    return localStorage.getItem(DEV_FLAG) === '1';
  } catch {
    return false;
  }
}

/** Available from title / entry points. */
export function isBossLevelAvailable(): boolean {
  return areAllCoreAchievementsUnlocked() || isBossDevUnlocked();
}

/**
 * Call after achievement unlocks may have completed the core set.
 * Marks a one-shot pending intro so EndScene can route to the cutscene.
 */
export function maybeFlagBossIntroPending(): boolean {
  if (!areAllCoreAchievementsUnlocked()) return false;
  try {
    if (localStorage.getItem(INTRO_DONE) === '1') return false;
    if (localStorage.getItem(INTRO_PENDING) === '1') return true;
    localStorage.setItem(INTRO_PENDING, '1');
    return true;
  } catch {
    return areAllCoreAchievementsUnlocked();
  }
}

export function isBossIntroPending(): boolean {
  try {
    return localStorage.getItem(INTRO_PENDING) === '1';
  } catch {
    return false;
  }
}

/** Clear pending and mark intro as shown (cutscene started). */
export function markBossIntroStarted(): void {
  try {
    localStorage.removeItem(INTRO_PENDING);
    localStorage.setItem(INTRO_DONE, '1');
  } catch {
    /* ignore */
  }
}
