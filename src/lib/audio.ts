import type { CueName } from "../types";

// Module-level singleton — one AudioContext shared across all cue plays.
// Browsers require a user gesture before creating or resuming an AudioContext,
// so this is lazily initialised on the first playCue call.
let audioCtx: AudioContext | null = null;

const getAudioCtx = (): AudioContext | null => {
  // webkitAudioContext covers older Safari versions that don't expose AudioContext.
  const Ctx =
    typeof window !== "undefined" &&
    (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
};

// Play a single sine tone with a short attack/release envelope.
// The envelope prevents clicks that occur when an oscillator starts or stops abruptly.
const playTone = (
  ctx: AudioContext,
  freq: number,
  at: number,
  dur: number,
  peak: number,
): void => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
};

/* Each cue is a list of [frequency, offset, duration, peak gain]. */
const CUES: Record<CueName, [number, number, number, number][]> = {
  correct: [
    [659.25, 0, 0.13, 0.13],
    [987.77, 0.09, 0.2, 0.11],
  ],
  wrong: [
    [233.08, 0, 0.18, 0.12],
    [174.61, 0.11, 0.26, 0.1],
  ],
  start: [
    [523.25, 0, 0.11, 0.1],
    [783.99, 0.1, 0.22, 0.1],
  ],
  end: [
    [880, 0, 0.16, 0.11],
    [880, 0.2, 0.16, 0.11],
    [587.33, 0.4, 0.5, 0.12],
  ],
};

// Play a named audio cue (e.g. "correct", "wrong") by scheduling its tones
// at the current audio context time. All times are relative offsets from now.
export const playCue = (name: CueName): void => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  (CUES[name] || []).forEach(([f, off, dur, peak]) =>
    playTone(ctx, f, t + off, dur, peak),
  );
};
