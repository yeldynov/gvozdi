/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mergeSessions, parseBackup, serializeBackup } from './backup.ts';
import type { Session } from './types.ts';

const s = (id: string, updatedAt: string, extra: Partial<Session> = {}): Session => ({
  id,
  startedAt: '2026-10-01T08:00:00.000Z',
  durationSec: 300,
  mode: 'timed',
  updatedAt,
  ...extra,
});

test('round-trips through serialize/parse', () => {
  const sessions = [s('a', '2026-10-01T09:00:00.000Z', { tension: 'mild', note: 'ok', goalSec: 300 })];
  assert.deepEqual(JSON.parse(JSON.stringify(parseBackup(serializeBackup(sessions)))), sessions);
});

test('rejects foreign or malformed files', () => {
  assert.throws(() => parseBackup('not json'));
  assert.throws(() => parseBackup('{"sessions":[]}'));
  assert.throws(() => parseBackup(JSON.stringify({ app: 'gvozdi', sessions: [{ id: 'x', mode: 'peak' }] })));
});

test('drops unknown fields and bad optional values', () => {
  const [got] = parseBackup(
    JSON.stringify({ app: 'gvozdi', sessions: [{ ...s('a', 'nope'), tension: 'huge', hack: 1 }] }),
  );
  assert.equal(got.tension, undefined);
  assert.equal(got.updatedAt, got.startedAt);
  assert.equal('hack' in got, false);
});

test('merge keeps newer updatedAt per id', () => {
  const merged = mergeSessions(
    [s('a', '2026-10-02T00:00:00.000Z', { note: 'mine' }), s('b', '2026-10-01T00:00:00.000Z')],
    [s('a', '2026-10-01T00:00:00.000Z', { note: 'old' }), s('b', '2026-10-03T00:00:00.000Z', { note: 'new' }), s('c', '2026-10-01T00:00:00.000Z')],
  );
  assert.deepEqual(
    merged.map((x) => [x.id, x.note]),
    [['a', 'mine'], ['b', 'new'], ['c', undefined]],
  );
});
