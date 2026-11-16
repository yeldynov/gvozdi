// Pure session-timer logic: no React. Times are epoch ms so the clock, not a tick counter, is the source of truth.

export const PRESET_MINUTES = [3, 5, 10, 15, 20, 30];
export const MAX_MINUTES = 90;

export const clampMinutes = (m: number) => Math.min(MAX_MINUTES, Math.max(1, Math.round(m)));

// The −/+ steps: single minutes up to 30, then the next five (a typed 32 steps to 35 or 30).
export const stepMinutes = (m: number, d: 1 | -1) =>
  clampMinutes(m + d > 30 || m > 30 ? (d > 0 ? Math.floor(m / 5) * 5 + 5 : Math.ceil(m / 5) * 5 - 5) : m + d);

export type Clock = { startedAt: number; pausedMs: number; pausedAt: number | null };

export const startClock = (now: number): Clock => ({ startedAt: now, pausedMs: 0, pausedAt: null });

export function pauseClock(c: Clock, now: number): Clock {
  return c.pausedAt === null ? { ...c, pausedAt: now } : c;
}

export function resumeClock(c: Clock, now: number): Clock {
  return c.pausedAt === null ? c : { ...c, pausedMs: c.pausedMs + now - c.pausedAt, pausedAt: null };
}

/** Whole seconds stood on the board; survives backgrounding because it's computed from timestamps. */
export function elapsedSec(c: Clock, now: number): number {
  const end = c.pausedAt ?? now;
  return Math.max(0, Math.floor((end - c.startedAt - c.pausedMs) / 1000));
}

// Peak mode: sharpest from the first step to 1:30, still stings until 7:00, then eases.
export const PEAK_SEC = 90;
export const MILD_SEC = 420;

export type PeakStage = 'sharp' | 'stings' | 'easier';

export function peakStage(elapsed: number): PeakStage {
  return elapsed < PEAK_SEC ? 'sharp' : elapsed < MILD_SEC ? 'stings' : 'easier';
}

/** Felt intensity 0..1: a steep climb to 1 at 1:30, decay to about 0.2 by 7:00, then 0 (calm). */
export function peakIntensity(elapsed: number): number {
  if (elapsed < PEAK_SEC) return 1 - (1 - elapsed / PEAK_SEC) ** 2;
  if (elapsed < MILD_SEC) return 0.2 + 0.8 * Math.exp(-(elapsed - PEAK_SEC) / 90);
  return 0;
}

export type PeakCaption = 'sharp' | 'exhale' | 'climbing' | 'soften' | 'hold' | 'top' | 'past' | 'adapting' | 'goal';

// The sharp stretch talks more often: a new line every 12-20 s until it turns.
export function peakCaption(elapsed: number, goalSec: number): PeakCaption {
  if (goalSec && elapsed >= goalSec) return 'goal';
  if (elapsed < 12) return 'sharp';
  if (elapsed < 25) return 'exhale';
  if (elapsed < 45) return 'climbing';
  if (elapsed < 60) return 'soften';
  if (elapsed < 80) return 'hold';
  if (elapsed < PEAK_SEC + 15) return 'top';
  if (elapsed < MILD_SEC) return 'past';
  return 'adapting';
}
