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

export type PeakCaption = 'sharp' | 'climbing' | 'top' | 'past' | 'adapting' | 'goal';

export function peakCaption(elapsed: number, goalSec: number): PeakCaption {
  if (goalSec && elapsed >= goalSec) return 'goal';
  if (elapsed < 15) return 'sharp';
  if (elapsed < 60) return 'climbing';
  if (elapsed < PEAK_SEC + 15) return 'top';
  if (elapsed < MILD_SEC) return 'past';
  return 'adapting';
}
