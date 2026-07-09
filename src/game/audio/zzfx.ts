/**
 * Minimal ZzFX-style synth (Web Audio).
 * Adapted from Frank Force's ZzFX — generates one-shot samples from param arrays.
 */

export type ZzfxParams = number[];

let sharedCtx: AudioContext | null = null;

/** Prefer Phaser's context so SFX/BGM/file audio share one unlock. */
export function setAudioContext(ctx: AudioContext | null): void {
  if (ctx) sharedCtx = ctx;
}

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (sharedCtx) return sharedCtx;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  sharedCtx = new AC();
  return sharedCtx;
}

export async function resumeAudioContext(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;
  // suspended | interrupted (Safari) both need resume
  if (ctx.state !== 'running') {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }
  return ctx.state === 'running';
}

const ZZFX_VOLUME = 0.35;

/**
 * Play a ZzFX parameter array.
 * [volume, randomness, frequency, attack, sustain, release, shape, shapeCurve,
 *  slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise, modulation,
 *  bitCrush, delay, sustainVolume, decay, tremolo]
 */
export function zzfxPlay(params: ZzfxParams, masterVolume = 1): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  // Soft-fail if still suspended; caller should have tried resume
  if (ctx.state !== 'running') return;

  const volume = params[0] ?? 1;
  const randomness = params[1] ?? 0.05;
  let frequency = (params[2] ?? 220) * (1 + randomness * (2 * Math.random() - 1));
  const attack = params[3] ?? 0;
  const sustain = params[4] ?? 0;
  const release = params[5] ?? 0.1;
  const shape = params[6] ?? 0;
  const shapeCurve = params[7] ?? 1;
  const slide = params[8] ?? 0;
  let deltaSlide = params[9] ?? 0;
  let pitchJump = params[10] ?? 0;
  const pitchJumpTime = params[11] ?? 0;
  const repeatTime = params[12] ?? 0;
  const noise = params[13] ?? 0;
  const modulation = params[14] ?? 0;
  const bitCrush = params[15] ?? 0;
  const delay = params[16] ?? 0;
  const sustainVolume = params[17] ?? 1;
  const decay = params[18] ?? 0;
  const tremolo = params[19] ?? 0;

  const sampleRate = ctx.sampleRate;
  // Keep envelopes short but audible (avoid multi-second / zero-length buffers)
  const attackS = Math.max(1, (attack * sampleRate) | 0);
  const decayS = Math.max(0, (decay * sampleRate) | 0);
  const sustainS = Math.max(0, (sustain * sampleRate) | 0);
  const releaseS = Math.max(1, (release * sampleRate) | 0);
  const delayS = Math.max(0, (delay * sampleRate) | 0);

  deltaSlide *= (500 * Math.PI) / sampleRate ** 2;
  let slideFreq = (slide * Math.PI * 2) / sampleRate;
  const startSlide = slideFreq;
  let pitchJumpAmount = (pitchJump * Math.PI * 2) / sampleRate;
  let pitchJumpTimer = (pitchJumpTime * sampleRate) | 0;
  let repeatTimer = (repeatTime * sampleRate) | 0;
  const startFreq = frequency;
  const startPitchJump = pitchJumpAmount;

  let length = (attackS + decayS + sustainS + releaseS + delayS) | 0;
  // Cap buffer length (~1s) so bad params can't hang the main thread
  length = Math.min(length, sampleRate | 0);
  if (length <= 0) return;

  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  let phase = 0;
  let noiseState = 0;
  let crush = 0;
  let modPhase = 0;
  const modStep = (modulation * Math.PI * 2) / sampleRate;

  for (let i = 0; i < length; i++) {
    if (repeatTime && --repeatTimer <= 0) {
      frequency = startFreq;
      pitchJumpAmount = startPitchJump;
      slideFreq = startSlide;
      repeatTimer = (repeatTime * sampleRate) | 0;
      pitchJumpTimer = (pitchJumpTime * sampleRate) | 0;
    }
    if (pitchJumpTime && pitchJumpTimer > 0 && --pitchJumpTimer === 0) {
      frequency += pitchJump;
    }

    slideFreq += deltaSlide;
    // Clamp slide so frequency stays finite
    frequency *= 1 + Math.max(-0.05, Math.min(0.05, slideFreq));
    frequency = Math.max(20, Math.min(8000, frequency));

    modPhase += modStep;
    const mod = modulation ? 1 + Math.sin(modPhase) * Math.min(1, Math.abs(modulation)) : 1;
    phase += (frequency * mod) / sampleRate;
    let t = phase;

    if (noise) {
      noiseState = noiseState * (1 - Math.min(1, noise)) + (Math.random() * 2 - 1) * noise;
      t += noiseState;
    }

    let wave: number;
    const p = t % 1;
    switch (shape | 0) {
      case 1:
        wave = p < 0.5 ? 1 : -1;
        break;
      case 2:
        wave = p * 2 - 1;
        break;
      case 3:
        wave = 1 - Math.abs(p * 4 - 2);
        break;
      default:
        wave = Math.sin(t * Math.PI * 2);
    }

    const curved = Math.sign(wave) * Math.pow(Math.abs(wave), Math.max(0.1, shapeCurve));
    wave = Number.isFinite(curved) ? curved : 0;

    let env: number;
    if (i < attackS) {
      env = i / attackS;
    } else if (i < attackS + decayS) {
      env = 1 - ((i - attackS) / Math.max(1, decayS)) * (1 - sustainVolume);
    } else if (i < attackS + decayS + sustainS) {
      env = sustainVolume;
    } else {
      const rel = i - attackS - decayS - sustainS;
      env = sustainVolume * (1 - rel / Math.max(1, releaseS));
    }
    env = Math.max(0, Math.min(1, env));

    if (tremolo) {
      env *= 1 - tremolo + tremolo * Math.sin((i / sampleRate) * Math.PI * 10);
    }

    let sample = wave * env * volume * ZZFX_VOLUME * masterVolume;
    if (!Number.isFinite(sample)) sample = 0;

    if (bitCrush) {
      crush++;
      if (crush < 1 + 32 * bitCrush) {
        data[i] = i > 0 ? data[i - 1]! : sample;
        continue;
      }
      crush = 0;
    }
    data[i] = Math.max(-1, Math.min(1, sample));
  }

  try {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 1;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch {
    /* ignore */
  }
}

/** Simple tone for music sequencer. */
export function playTone(
  frequency: number,
  durationSec: number,
  volume = 0.15,
  type: OscillatorType = 'square',
): void {
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;
  if (!Number.isFinite(frequency) || frequency <= 0) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = Math.max(20, Math.min(4000, frequency));
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    const dur = Math.max(0.02, durationSec);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.linearRampToValueAtTime(volume * 0.65, now + dur * 0.5);
    gain.gain.linearRampToValueAtTime(0, now + dur);
    osc.start(now);
    osc.stop(now + dur + 0.03);
  } catch {
    /* ignore */
  }
}
