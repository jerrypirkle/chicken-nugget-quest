import { getAudioContext, playTone } from './zzfx';

/** Simple greasy-dungeon chiptune pattern (Hz). 0 = rest. */
const PATTERN: number[] = [
  196, 0, 233, 0, 262, 233, 196, 0, 175, 0, 196, 233, 262, 0, 311, 0, 294, 262, 233, 196, 175, 0,
  196, 0, 233, 262, 294, 0, 262, 233, 196, 0,
];

const STEP_MS = 140;
const NOTE_SEC = 0.12;

export class MusicLoop {
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private volume = 0.08;
  private enabled = false;

  setVolume(v: number): void {
    this.volume = v;
  }

  start(): void {
    if (this.timer) return;
    this.enabled = true;
    this.step = 0;
    this.timer = setInterval(() => this.tick(), STEP_MS);
  }

  stop(): void {
    this.enabled = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.step = 0;
  }

  isPlaying(): boolean {
    return this.timer !== null;
  }

  private tick(): void {
    if (!this.enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state !== 'running') {
      // Try to recover after tab blur / OS interrupt
      void ctx.resume().catch(() => undefined);
      return;
    }

    const freq = PATTERN[this.step % PATTERN.length]!;
    this.step++;
    if (freq > 0) {
      playTone(freq, NOTE_SEC, this.volume, 'square');
      playTone(freq * 1.5, NOTE_SEC * 0.8, this.volume * 0.35, 'triangle');
    }
  }
}
