// Pure session-timer logic: no React. Times are epoch ms so the clock, not a tick counter, is the source of truth.

export const PRESET_MINUTES = [3, 5, 10, 15, 20, 30];
export const MAX_MINUTES = 90;

export const clampMinutes = (m: number) => Math.min(MAX_MINUTES, Math.max(1, Math.round(m)));

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

// Peak mode: sensation climbs from the first step, tops out at 1:30, eases by 7:00.
export const PEAK_SEC = 90;
export const MILD_SEC = 420;

/** Felt intensity 0..1 at second t: ease-out climb to 1 at PEAK_SEC, then decays toward a mild floor. */
export function intensityAt(t: number): number {
  if (t < PEAK_SEC) return 1 - (1 - t / PEAK_SEC) ** 2;
  return 0.15 + 0.85 * Math.exp(-(t - PEAK_SEC) / 90);
}

export type PeakCaption = 'sharp' | 'climbing' | 'top' | 'past' | 'adapting' | 'goal';

export function peakCaption(elapsed: number, goalSec: number): PeakCaption {
  if (goalSec && elapsed >= goalSec) return 'goal';
  if (elapsed < 15) return 'sharp';
  if (elapsed < 60) return 'climbing';
  if (elapsed < PEAK_SEC + 15) return 'top';
  if (elapsed < 180) return 'past';
  return 'adapting';
}
