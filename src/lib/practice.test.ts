/// <reference types="node" />
// Run: npm test  (Node's built-in runner; Node strips the types)
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ACHIEVEMENTS,
  achievementEarnedAt,
  achievementProgress,
  bestStreak,
  currentStreak,
  earnedAchievementIds,
  formatDuration,
  groupByDay,
  lastDays,
  shiftTime,
  suggestedMinutes,
  totals,
} from './practice.ts';
import type { Session } from './types.ts';

const now = new Date(2026, 9, 27, 20, 0); // 27 Oct 2026, 20:00 local
const at = (daysAgo: number, durationSec = 300, hour = 8): Session => {
  const d = new Date(2026, 9, 27 - daysAgo, hour);
  return { id: `${daysAgo}-${hour}`, startedAt: d.toISOString(), updatedAt: d.toISOString(), durationSec, mode: 'free' };
};

test('streak counts through yesterday when today has no session yet', () => {
  assert.equal(currentStreak([at(1), at(2), at(3)], now), 3);
  assert.equal(currentStreak([at(0), at(1)], now), 2);
  assert.equal(currentStreak([at(2), at(3)], now), 0);
  assert.equal(currentStreak([at(0), at(0, 300, 18), at(2)], now), 1); // two sessions one day count once
});

test('deleted sessions do not count', () => {
  assert.equal(currentStreak([at(0), { ...at(1), deletedAt: now.toISOString() }, at(2)], now), 1);
  assert.equal(totals([at(0), { ...at(1), deletedAt: 'x' }]).count, 1);
});

test('achievements come from the best streak, so a broken streak keeps them', () => {
  const brokenWeek = [10, 11, 12, 13, 14, 15, 16].map((d) => at(d));
  assert.equal(currentStreak(brokenWeek, now), 0);
  assert.equal(bestStreak(brokenWeek), 7);
  assert.deepEqual(earnedAchievementIds(brokenWeek), ['first_session', 'streak_3', 'streak_7']);
  assert.equal(achievementEarnedAt('streak_3', brokenWeek), at(14).startedAt);
  const byId = (id: string) => ACHIEVEMENTS.find((a) => a.id === id)!;
  assert.equal(achievementProgress(byId('streak_14'), brokenWeek), 7);
  assert.equal(achievementProgress(byId('streak_3'), brokenWeek), 3); // capped at target
  assert.equal(achievementProgress(byId('sessions_10'), brokenWeek), 7);
});

test('durations of an hour or more keep their hours', () => {
  assert.equal(formatDuration(59), '0:59');
  assert.equal(formatDuration(605), '10:05');
  assert.equal(formatDuration(3725), '1:02:05');
});

test('last 7 days, suggested minutes, totals', () => {
  const week = lastDays([at(0, 120), at(0, 60), at(6, 600), at(7, 600)], now);
  assert.equal(week.length, 7);
  assert.equal(week[6].minutes, 3);
  assert.equal(week[0].minutes, 10);
  assert.equal(suggestedMinutes([]), 3);
  assert.equal(suggestedMinutes([at(1, 300), at(0, 900)]), 17);
  assert.equal(suggestedMinutes([at(0, 89 * 60)]), 90);
  assert.deepEqual(totals([at(0, 100), at(1, 300)]), { count: 2, totalSec: 400, avgSec: 200, longestSec: 300 });
});

test('groupByDay: newest first, tombstones dropped, day totals', () => {
  const sessions = [at(1, 60, 8), at(0, 120, 7), at(0, 180, 9), { ...at(0, 999, 10), deletedAt: 'x' }];
  const g = groupByDay(sessions);
  assert.deepEqual(g.map((x) => x.sessions.length), [2, 1]);
  assert.equal(g[0].totalSec, 300);
  assert.equal(g[0].sessions[0].durationSec, 180);
});

test('shiftTime wraps around midnight', () => {
  assert.equal(shiftTime('20:00', 15), '20:15');
  assert.equal(shiftTime('23:50', 15), '00:05');
  assert.equal(shiftTime('00:05', -15), '23:50');
});
