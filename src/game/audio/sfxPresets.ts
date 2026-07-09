import type { ZzfxParams } from './zzfx';

export type SfxCue =
  | 'ui'
  | 'move'
  | 'bump'
  | 'attack'
  | 'hit'
  | 'eat'
  | 'sauce'
  | 'stairs'
  | 'hangry'
  | 'death'
  | 'win'
  | 'highScore';

/** ZzFX param arrays: [volume, randomness, freq, attack, sustain, release, shape, ...] */
export const SFX_PRESETS: Record<SfxCue, ZzfxParams> = {
  // Soft menu blip
  ui: [0.6, 0.02, 660, 0, 0.02, 0.08, 1, 1.5],

  // Footstep / rustle
  move: [0.25, 0.1, 120, 0, 0.01, 0.04, 3, 1, 0, 0, 0, 0, 0, 0.4],

  // Wall thud
  bump: [0.5, 0.05, 80, 0, 0.02, 0.1, 1, 1, -0.5],

  // Swish / thwack
  attack: [0.7, 0.08, 280, 0, 0.02, 0.12, 1, 1.2, -2],

  // Hurt
  hit: [0.65, 0.1, 180, 0, 0.03, 0.15, 1, 1, -4, 0.2],

  // Crunchy munch
  eat: [0.7, 0.15, 320, 0, 0.04, 0.1, 3, 1, 0, 0, 0, 0, 0, 0.6],

  // Rising sauce jingle
  sauce: [0.8, 0.02, 440, 0.01, 0.08, 0.2, 1, 1.5, 4, 0.1, 200, 0.08],

  // Descend whoosh
  stairs: [0.55, 0.05, 360, 0.02, 0.05, 0.25, 0, 1, -3, 0.05],

  // Hangry growl
  hangry: [0.85, 0.12, 90, 0.05, 0.12, 0.2, 1, 0.8, 1.5, 0.1, 0, 0, 0, 0.3],

  // Sad descend
  death: [0.9, 0.02, 220, 0.05, 0.15, 0.45, 0, 1, -2, 0.05],

  // Tiny fanfare
  win: [0.85, 0.01, 523, 0.02, 0.1, 0.25, 1, 1.2, 2, 0.05, 300, 0.1],

  // Bigger high-score victory (brighter, longer)
  highScore: [1, 0.01, 660, 0.02, 0.15, 0.4, 1, 1.4, 3, 0.08, 400, 0.12, 0.15],
};
