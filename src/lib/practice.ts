// Pure practice logic: no React, no storage. Every function takes sessions (and `now`) so it is testable.
import type { Session } from './types';

const DAY_MS = 86_400_000;

/** Local calendar day, 'YYYY-MM-DD'. */
export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function shiftDay(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + days));
}

export function live(sessions: Session[]): Session[] {
  return sessions.filter((s) => !s.deletedAt);
}

/** Unique practice days, ascending. */
function practiceDays(sessions: Session[]): string[] {
  return [...new Set(live(sessions).map((s) => dayKey(new Date(s.startedAt))))].sort();
}

/** Consecutive days ending today, or yesterday (today isn't over yet, so the streak isn't broken). */
export function currentStreak(sessions: Session[], now = new Date()): number {
  const days = practiceDays(sessions);
  const today = dayKey(now);
  let expected = days.includes(today) ? today : shiftDay(today, -1);
  let streak = 0;
  for (let i = days.length - 1; i >= 0 && days[i] === expected; i--) {
    streak++;
    expected = shiftDay(expected, -1);
  }
  return streak;
}

export function bestStreak(sessions: Session[]): number {
  const days = practiceDays(sessions);
  let best = 0;
  let run = 0;
  days.forEach((d, i) => {
    run = i > 0 && shiftDay(days[i - 1], 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

export type Achievement = { id: string; kind: 'streak' | 'count'; target: number };

// Labels live in i18n under achievements.<id>.
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_session', kind: 'count', target: 1 },
  { id: 'streak_3', kind: 'streak', target: 3 },
  { id: 'streak_7', kind: 'streak', target: 7 },
  { id: 'sessions_10', kind: 'count', target: 10 },
  { id: 'streak_14', kind: 'streak', target: 14 },
  { id: 'streak_30', kind: 'streak', target: 30 },
  { id: 'streak_60', kind: 'streak', target: 60 },
  { id: 'streak_100', kind: 'streak', target: 100 },
  { id: 'streak_365', kind: 'streak', target: 365 },
];

/** Progress toward the target, capped at it: session count, or the best streak ever. */
export function achievementProgress(a: Achievement, sessions: Session[]): number {
  return Math.min(a.target, a.kind === 'count' ? live(sessions).length : bestStreak(sessions));
}

/** Earned from the best streak ever, so achievements never disappear when a streak breaks. */
export function earnedAchievementIds(sessions: Session[]): string[] {
  return ACHIEVEMENTS.filter((a) => achievementProgress(a, sessions) >= a.target).map((a) => a.id);
}

/** Tree stage an achievement grows: everyone starts with a seed (1), the first achievement makes it sprout (2). */
export function achievementStage(a: Achievement): number {
  return ACHIEVEMENTS.indexOf(a) + 2;
}

/** Tree stage for the furthest achievement earned: 1 seed … ACHIEVEMENTS.length + 1 in bloom. */
export function treeStage(sessions: Session[]): number {
  const earned = earnedAchievementIds(sessions);
  return ACHIEVEMENTS.findLastIndex((a) => earned.includes(a.id)) + 2;
}

/** ISO time of the session that unlocked the achievement, or null. */
export function achievementEarnedAt(id: string, sessions: Session[]): string | null {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  const sorted = live(sessions).sort((x, y) => x.startedAt.localeCompare(y.startedAt));
  if (!a) return null;
  if (a.kind === 'count') return sorted[a.target - 1]?.startedAt ?? null;
  let run = 0;
  let prev = '';
  for (const s of sorted) {
    const d = dayKey(new Date(s.startedAt));
    if (d === prev) continue;
    run = prev && shiftDay(prev, 1) === d ? run + 1 : 1;
    prev = d;
    if (run >= a.target) return s.startedAt;
  }
  return null;
}

/** Live sessions grouped by local day, newest day and newest session first. */
export function groupByDay(sessions: Session[]): { day: string; sessions: Session[]; totalSec: number }[] {
  const groups = new Map<string, Session[]>();
  for (const s of live(sessions).sort((a, b) => b.startedAt.localeCompare(a.startedAt))) {
    const day = dayKey(new Date(s.startedAt));
    groups.set(day, [...(groups.get(day) ?? []), s]);
  }
  return [...groups].map(([day, list]) => ({ day, sessions: list, totalSec: list.reduce((n, s) => n + s.durationSec, 0) }));
}

/** 'm:ss' under an hour, 'h:mm:ss' from an hour up. */
export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = String(sec % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** Shift an 'HH:mm' time by `deltaMin`, wrapping around midnight. */
export function shiftTime(hhmm: string, deltaMin: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const t = (((h * 60 + m + deltaMin) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

/** Reminder times for the next `days` days at hh:mm, skipping today if already practised or the time has passed. */
export function reminderDates(hhmm: string, practisedToday: boolean, now = new Date(), days = 14): Date[] {
  const [h, m] = hhmm.split(':').map(Number);
  const out: Date[] = [];
  for (let i = 0; i < days; i++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, h, m);
    if (i === 0 && (practisedToday || at <= now)) continue;
    out.push(at);
  }
  return out;
}

/** Minutes practised per day for the last `n` days, oldest first. */
export function lastDays(sessions: Session[], now = new Date(), n = 7): { day: string; minutes: number }[] {
  const today = dayKey(now);
  const out = Array.from({ length: n }, (_, i) => ({ day: shiftDay(today, i - n + 1), minutes: 0 }));
  for (const s of live(sessions)) {
    const row = out.find((r) => r.day === dayKey(new Date(s.startedAt)));
    if (row) row.minutes += s.durationSec / 60;
  }
  return out;
}

export function totals(sessions: Session[]) {
  const l = live(sessions);
  const totalSec = l.reduce((sum, s) => sum + s.durationSec, 0);
  return {
    count: l.length,
    totalSec,
    avgSec: l.length ? Math.round(totalSec / l.length) : 0,
    longestSec: l.reduce((max, s) => Math.max(max, s.durationSec), 0),
  };
}

/** Next session length in minutes: a little longer than the last one, capped at 90. */
export function suggestedMinutes(sessions: Session[]): number {
  const last = live(sessions).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  if (!last) return 3;
  const mins = last.durationSec / 60;
  if (mins < 1) return 1;
  const step = mins < 10 ? 1 : mins < 20 ? 2 : mins < 30 ? 5 : 10;
  return Math.min(90, Math.round(mins) + step);
}

export type Level = { id: string; totalMin: number; longestMin: number };

// Both thresholds must be met; labels live in i18n under levels.<id>.
export const LEVELS: Level[] = [
  { id: 'beginner', totalMin: 0, longestMin: 0 },
  { id: 'steady', totalMin: 60, longestMin: 5 },
  { id: 'practitioner', totalMin: 300, longestMin: 10 },
  { id: 'adept', totalMin: 1000, longestMin: 20 },
  { id: 'master', totalMin: 3000, longestMin: 30 },
];

export function levelOf(sessions: Session[]) {
  const { totalSec, longestSec } = totals(sessions);
  const i = LEVELS.findLastIndex((l) => totalSec >= l.totalMin * 60 && longestSec >= l.longestMin * 60);
  return { level: LEVELS[i], next: LEVELS[i + 1], totalMin: Math.floor(totalSec / 60), longestMin: Math.floor(longestSec / 60) };
}

/** Minutes for each day of the 21-day program. */
export const PROGRAM = [2, 2, 3, 3, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 11, 12, 13, 14, 15, 17, 20];

/**
 * Today's program day, or null when the user hasn't joined (`joined` is the dayKey they did).
 * It advances one step per practice day since joining, so a missed day pauses rather than resets.
 * `done` counts today if already practised; `finished` once 21 earlier days have been practised.
 */
export function programDay(sessions: Session[], joined?: string, now = new Date()) {
  if (!joined) return null;
  const today = dayKey(now);
  const days = practiceDays(sessions).filter((d) => d >= joined);
  const before = days.filter((d) => d < today).length;
  if (before >= PROGRAM.length) return { day: PROGRAM.length, minutes: suggestedMinutes(sessions), done: PROGRAM.length, finished: true };
  return { day: before + 1, minutes: PROGRAM[before], done: before + (days.includes(today) ? 1 : 0), finished: false };
}

/** What Home and Practice offer: the program's minutes while it runs, otherwise the adaptive suggestion. */
export function todayMinutes(sessions: Session[], joined?: string, now = new Date()): number {
  return programDay(sessions, joined, now)?.minutes ?? suggestedMinutes(sessions);
}

/** Dev-only: one session a day for `days` days, ending today. */
export function seedSessions(now = new Date(), days = 180): Session[] {
  return Array.from({ length: days }, (_, i) => {
    const start = new Date(now.getTime() - (days - 1 - i) * DAY_MS);
    start.setHours(7 + (i % 12), (i * 17) % 60, 0, 0);
    const iso = start.toISOString();
    return { id: `seed-${i}`, startedAt: iso, updatedAt: iso, durationSec: 300 + ((i * 137) % 2100), mode: 'timed' };
  });
}
