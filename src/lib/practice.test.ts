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
  levelOf,
  nextAchievement,
  PROGRAM,
  programDay,
  reminderDates,
  shiftTime,
  suggestedMinutes,
  todayMinutes,
  todaySec,
  totals,
  treeStage,
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

test('levelOf needs both total and longest thresholds', () => {
  assert.equal(levelOf([]).level.id, 'beginner');
  // 80 min total but longest only 4 min: still beginner
  assert.equal(levelOf(Array.from({ length: 20 }, (_, i) => at(i, 240))).level.id, 'beginner');
  const l = levelOf([at(0, 60 * 60), at(1, 11 * 60)]);
  assert.equal(l.level.id, 'steady');
  assert.equal(l.next?.id, 'practitioner');
  assert.equal(l.totalMin, 71);
});

test('programDay: null until joined, counts days since joining, pauses on gaps, finishes after 21', () => {
  const joined = '2026-10-01';
  assert.equal(programDay([at(2)], undefined, now), null);
  assert.deepEqual(programDay([], joined, now), { day: 1, minutes: 2, done: 0, finished: false });
  // practised 2 days ago and today (gap yesterday): day 2, today counted as done
  assert.deepEqual(programDay([at(2), at(0), at(0, 60, 9)], joined, now), { day: 2, minutes: 2, done: 2, finished: false });
  // days before joining don't count
  assert.equal(programDay([at(5), at(2)], '2026-10-24', now)?.day, 2);
  const past = Array.from({ length: 21 }, (_, i) => at(i + 1));
  assert.equal(programDay(past.slice(1), joined, now)?.day, 21);
  assert.equal(programDay(past, joined, now)?.finished, true);
  assert.equal(todayMinutes(past.slice(1), joined, now), PROGRAM[20]);
  assert.equal(todayMinutes(past, joined, now), 6); // finished: 5 min last session + 1
  assert.equal(todayMinutes([at(1)], undefined, now), 6); // not joined: adaptive suggestion
});

test('todaySec sums only today; nextAchievement is the first unearned', () => {
  assert.equal(todaySec([at(0, 120), at(0, 60, 9), at(1, 600)], now), 180);
  assert.deepEqual(nextAchievement([]), { a: ACHIEVEMENTS[0], value: 0 });
  assert.equal(nextAchievement([at(1), at(0)])?.a.id, 'streak_3');
  assert.equal(nextAchievement([at(1), at(0)])?.value, 2);
  assert.equal(treeStage([]), 1); // everyone starts with a seed
  assert.equal(treeStage([at(0)]), 2); // first session: sprout
  assert.equal(treeStage([at(2), at(1), at(0)]), 3); // three days in a row: seedling
});

test('reminderDates skips today once practised or past, then one per day', () => {
  const later = reminderDates('21:00', false, now, 3); // now is 20:00
  assert.deepEqual(later.map((d) => d.getDate()), [27, 28, 29]);
  assert.equal(later[0].getHours(), 21);
  assert.deepEqual(reminderDates('21:00', true, now, 3).map((d) => d.getDate()), [28, 29]);
  assert.deepEqual(reminderDates('19:00', false, now, 3).map((d) => d.getDate()), [28, 29]);
});
