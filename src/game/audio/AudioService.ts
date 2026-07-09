import type Phaser from 'phaser';
import { MusicLoop } from './music';
import { SFX_PRESETS, type SfxCue } from './sfxPresets';
import { getAudioContext, resumeAudioContext, setAudioContext, zzfxPlay } from './zzfx';

const MUTE_KEY = 'cnq-mute';
const MOVE_COOLDOWN_MS = 55;

class AudioService {
  /** True after a user gesture attempted unlock (not the same as ctx.running). */
  private userActivated = false;
  private muted = false;
  private sfxVolume = 1;
  private lastMoveAt = 0;
  private readonly music = new MusicLoop();
  private phaserSound: Phaser.Sound.BaseSoundManager | null = null;

  constructor() {
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      this.muted = false;
    }
    this.music.setVolume(0.09);
  }

  /** Call once from Boot after Phaser has a sound manager. */
  bindPhaser(game: Phaser.Game): void {
    this.phaserSound = game.sound;
    const anySound = game.sound as Phaser.Sound.BaseSoundManager & {
      context?: AudioContext;
    };
    if (anySound.context) {
      setAudioContext(anySound.context);
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  isUnlocked(): boolean {
    return this.userActivated;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (muted) {
      this.music.stop();
      try {
        this.phaserSound?.stopAll();
      } catch {
        /* ignore */
      }
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Must be called from a user gesture (click/key). Marks audio as activated
   * and resumes the shared AudioContext (and Phaser sound unlock).
   */
  async unlock(): Promise<void> {
    this.userActivated = true;

    // Prefer Phaser's WebAudio context when available
    const anySound = this.phaserSound as
      | (Phaser.Sound.BaseSoundManager & { context?: AudioContext; unlock?: () => void })
      | null;
    if (anySound?.context) {
      setAudioContext(anySound.context);
    }
    if (anySound && 'unlock' in anySound && typeof anySound.unlock === 'function') {
      try {
        anySound.unlock();
      } catch {
        /* ignore */
      }
    }

    await resumeAudioContext();
  }

  /** Ensure context is running; safe to call often. */
  async ensureRunning(): Promise<boolean> {
    if (!this.userActivated) return false;
    return resumeAudioContext();
  }

  play(cue: SfxCue): void {
    if (this.muted || !this.userActivated) return;

    if (cue === 'move') {
      const now = performance.now();
      if (now - this.lastMoveAt < MOVE_COOLDOWN_MS) return;
      this.lastMoveAt = now;
    }

    const params = SFX_PRESETS[cue];
    if (!params) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state !== 'running') {
      // Fire-and-forget resume then play (covers tab blur / Safari interrupt)
      void resumeAudioContext().then((ok) => {
        if (ok && !this.muted) zzfxPlay(params, this.sfxVolume);
      });
      return;
    }

    zzfxPlay(params, this.sfxVolume);
  }

  startMusic(): void {
    if (this.muted || !this.userActivated) return;
    void resumeAudioContext().then((ok) => {
      if (ok && !this.muted) this.music.start();
    });
  }

  stopMusic(): void {
    this.music.stop();
  }

  resumeMusicIfNeeded(shouldPlay: boolean): void {
    if (shouldPlay && !this.muted && this.userActivated) {
      this.startMusic();
    } else {
      this.music.stop();
    }
  }

  /** Play a preloaded Phaser audio key (e.g. countdown tunes). */
  playPhaserKey(key: string, volume = 2.5): void {
    if (this.muted || !this.userActivated || !this.phaserSound) return;
    void resumeAudioContext().then(() => {
      if (this.muted || !this.phaserSound) return;
      try {
        this.phaserSound.stopByKey(key);
        this.phaserSound.play(key, { volume });
      } catch {
        /* ignore */
      }
    });
  }

  stopPhaserKey(key: string): void {
    try {
      this.phaserSound?.stopByKey(key);
    } catch {
      /* ignore */
    }
  }
}

/** Singleton used by all scenes. */
export const audio = new AudioService();
export type { SfxCue };
