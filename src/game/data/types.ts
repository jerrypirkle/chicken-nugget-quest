export type TileType =
  | 'wall'
  | 'floor'
  | 'door'
  | 'stairs'
  | 'exit'
  | 'sauce_altar';

export interface GridPos {
  x: number;
  y: number;
}

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  glyph: string;
  color: number;
  hp: number;
  attack: number;
  /** Tiles of aggro range (Chebyshev-ish via manhattan for simplicity). */
  aggroRange: number;
  speed: number;
  messages: {
    attack: string[];
    death: string[];
  };
}

export interface SauceDef {
  id: string;
  name: string;
  floor: number;
  color: number;
  blurb: string;
}

export interface FloorDef {
  index: number;
  name: string;
  sauceId: string;
  enemyIds: string[];
  nuggetCount: [number, number];
  enemyCount: [number, number];
  mapW: number;
  mapH: number;
  roomCount: [number, number];
}

export interface RunStats {
  floorsCleared: number;
  nuggetsEaten: number;
  enemiesSlain: number;
  turnsSurvived: number;
  /** Successful tile moves (path length). Lower is better for high score. */
  steps: number;
  saucesCollected: string[];
  /** Unique enemy type ids slain this run (for Combo Meal). */
  enemyTypesSlain: string[];
  causeOfDeath: string | null;
  victory: boolean;
  /** Set on victory when this run beat the stored best step count. */
  newHighScore?: boolean;
  /** Achievement ids newly unlocked during this run (for log / end UI). */
  newlyUnlockedAchievements?: string[];
}

/** Player vitality is a single hunger pool (no separate HP). */
export interface RunState {
  seed: number;
  floorIndex: number;
  hunger: number;
  maxHunger: number;
  /** Hunger chosen at run start (for retry / difficulty). */
  startingHunger: number;
  attack: number;
  sauces: string[];
  stats: RunStats;
}

export const TILE_SIZE = 24;
export const MAX_HUNGER = 100;
/** Title option 1 — easiest. */
export const HUNGER_EASY = 100;
/** Title option 2. */
export const HUNGER_MEDIUM = 80;
/** Title option 3 — hardest. */
export const HUNGER_HARD = 50;
/** Hunger spent on each successful move or attack. */
export const HUNGER_PER_ACTION = 1;
export const NUGGET_HUNGER = 18;
/** At or below this fraction of max hunger, player is hangry. */
export const HANGRY_THRESHOLD = 0.2;
/** Sprite scale multiplier while hangry. */
export const HANGRY_SPRITE_SCALE = 1.4;
export const TOTAL_FLOORS = 3;
