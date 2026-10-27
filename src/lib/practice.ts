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

/** Earned from the best streak ever, so achievements never disappear when a streak breaks. */
export function earnedAchievementIds(sessions: Session[]): string[] {
  const count = live(sessions).length;
  const best = bestStreak(sessions);
  return ACHIEVEMENTS.filter((a) => (a.kind === 'count' ? count : best) >= a.target).map((a) => a.id);
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

/** Dev-only: one session a day for `days` days, ending today. */
export function seedSessions(now = new Date(), days = 180): Session[] {
  return Array.from({ length: days }, (_, i) => {
    const start = new Date(now.getTime() - (days - 1 - i) * DAY_MS);
    start.setHours(7 + (i % 12), (i * 17) % 60, 0, 0);
    const iso = start.toISOString();
    return { id: `seed-${i}`, startedAt: iso, updatedAt: iso, durationSec: 300 + ((i * 137) % 2100), mode: 'timed' };
  });
}
