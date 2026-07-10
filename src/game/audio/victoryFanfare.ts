/**
 * Boss victory fanfare — Final Fantasy–style triumphant motif
 * filtered through chiptune + light dubstep wobble.
 */
import { getAudioContext } from './zzfx';

type Wave = OscillatorType;

interface Note {
  /** Start time offset from fanfare begin (seconds). */
  t: number;
  /** Frequency Hz. */
  f: number;
  /** Duration seconds. */
  d: number;
  /** Relative volume. */
  v?: number;
  wave?: Wave;
}

/** Classic short-short-short-long victory rhythm in a bright major key. */
const LEAD: Note[] = [
  // Opening stabs (FF energy)
  { t: 0.0, f: 523.25, d: 0.11, v: 1 }, // C5
  { t: 0.13, f: 523.25, d: 0.11, v: 1 },
  { t: 0.26, f: 523.25, d: 0.11, v: 1 },
  { t: 0.39, f: 523.25, d: 0.2, v: 1.05 },
  { t: 0.6, f: 392.0, d: 0.18, v: 0.95 }, // G4
  { t: 0.8, f: 440.0, d: 0.18, v: 0.95 }, // A4
  { t: 1.0, f: 523.25, d: 0.4, v: 1.1 }, // C5 hold

  // Rising answer
  { t: 1.5, f: 587.33, d: 0.12, v: 1 }, // D5
  { t: 1.64, f: 659.25, d: 0.12, v: 1 }, // E5
  { t: 1.78, f: 698.46, d: 0.12, v: 1 }, // F5
  { t: 1.92, f: 783.99, d: 0.45, v: 1.15 }, // G5

  // Chiptune drop resolution + bounce
  { t: 2.5, f: 659.25, d: 0.12, v: 0.9 },
  { t: 2.64, f: 523.25, d: 0.12, v: 0.9 },
  { t: 2.78, f: 659.25, d: 0.12, v: 0.95 },
  { t: 2.92, f: 783.99, d: 0.55, v: 1.2 }, // big G
];

/** Harmony thirds above lead (softer triangle). */
const HARMONY: Note[] = LEAD.map((n) => ({
  ...n,
  f: n.f * 1.25,
  v: (n.v ?? 1) * 0.4,
  wave: 'triangle' as Wave,
}));

/** Root bass pulses under the fanfare. */
const BASS_ROOTS: Note[] = [
  { t: 0.0, f: 130.81, d: 0.55, v: 0.7 }, // C3
  { t: 0.6, f: 98.0, d: 0.35, v: 0.65 }, // G2
  { t: 1.0, f: 130.81, d: 0.45, v: 0.7 },
  { t: 1.5, f: 146.83, d: 0.4, v: 0.65 }, // D3
  { t: 1.92, f: 98.0, d: 0.55, v: 0.75 },
  { t: 2.5, f: 130.81, d: 0.35, v: 0.7 },
  { t: 2.92, f: 98.0, d: 0.7, v: 0.8 },
];

function scheduleTone(
  ctx: AudioContext,
  startAt: number,
  freq: number,
  dur: number,
  volume: number,
  type: Wave,
): void {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, Math.min(4000, freq)), startAt);
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(volume, startAt + 0.012);
    gain.gain.linearRampToValueAtTime(volume * 0.7, startAt + dur * 0.45);
    gain.gain.linearRampToValueAtTime(0.0001, startAt + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + dur + 0.04);
  } catch {
    /* ignore */
  }
}

/**
 * Dubstep-ish wobble: saw/square bass with LFO on gain (chiptune grit).
 */
function scheduleWobble(
  ctx: AudioContext,
  startAt: number,
  freq: number,
  dur: number,
  volume: number,
  lfoRate: number,
): void {
  try {
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startAt);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(lfoRate, startAt);
    // Chiptune wobble depth
    lfoGain.gain.setValueAtTime(volume * 0.85, startAt);

    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(volume, startAt + 0.04);
    gain.gain.setValueAtTime(volume, startAt + dur * 0.7);
    gain.gain.linearRampToValueAtTime(0.0001, startAt + dur);

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startAt);
    lfo.start(startAt);
    osc.stop(startAt + dur + 0.05);
    lfo.stop(startAt + dur + 0.05);
  } catch {
    /* ignore */
  }
}

/** Noise burst — snare / glitch hit. */
function scheduleNoiseHit(ctx: AudioContext, startAt: number, dur: number, volume: number): void {
  try {
    const sampleRate = ctx.sampleRate;
    const len = Math.max(1, Math.floor(dur * sampleRate));
    const buffer = ctx.createBuffer(1, len, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(startAt);
    src.stop(startAt + dur + 0.02);
  } catch {
    /* ignore */
  }
}

/**
 * Play the full victory fanfare once.
 * @returns approximate duration in ms (for UI timing).
 */
export function playVictoryFanfare(masterVolume = 0.11): number {
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return 3500;

  const t0 = ctx.currentTime + 0.02;

  for (const n of LEAD) {
    scheduleTone(ctx, t0 + n.t, n.f, n.d, masterVolume * (n.v ?? 1), n.wave ?? 'square');
    // Soft octave sparkle
    scheduleTone(
      ctx,
      t0 + n.t,
      n.f * 2,
      n.d * 0.7,
      masterVolume * (n.v ?? 1) * 0.22,
      'triangle',
    );
  }

  for (const n of HARMONY) {
    scheduleTone(ctx, t0 + n.t, n.f, n.d, masterVolume * (n.v ?? 1), n.wave ?? 'triangle');
  }

  for (const n of BASS_ROOTS) {
    scheduleTone(ctx, t0 + n.t, n.f, n.d, masterVolume * (n.v ?? 1) * 1.1, 'square');
  }

  // Dubstep wobble drops under the long holds
  scheduleWobble(ctx, t0 + 1.0, 65.4, 0.45, masterVolume * 0.55, 6);
  scheduleWobble(ctx, t0 + 1.92, 49.0, 0.55, masterVolume * 0.65, 8);
  scheduleWobble(ctx, t0 + 2.92, 49.0, 0.75, masterVolume * 0.7, 12);

  // Percussive glitch hits on fanfare accents
  const hits = [0.0, 0.13, 0.26, 0.39, 1.0, 1.5, 1.92, 2.5, 2.92];
  for (const h of hits) {
    scheduleNoiseHit(ctx, t0 + h, 0.06, masterVolume * 0.35);
  }

  return 3800;
}
