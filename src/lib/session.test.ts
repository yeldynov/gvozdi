/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { clampMinutes, elapsedSec, intensityAt, pauseClock, peakCaption, resumeClock, startClock } from './session.ts';

test('elapsed comes from the clock and excludes paused time', () => {
  let c = startClock(0);
  assert.equal(elapsedSec(c, 65_400), 65); // e.g. 60s with the screen locked still counts
  c = pauseClock(c, 70_000);
  assert.equal(elapsedSec(c, 500_000), 70); // frozen while paused
  assert.equal(pauseClock(c, 80_000), c); // double pause is a no-op
  c = resumeClock(c, 100_000);
  assert.equal(elapsedSec(c, 110_000), 80);
  assert.equal(resumeClock(c, 120_000), c);
});

test('peak curve rises, peaks early, then eases', () => {
  assert.equal(intensityAt(0), 0);
  assert.ok(intensityAt(25) > 0.9);
  assert.ok(intensityAt(120) < intensityAt(60));
  assert.ok(intensityAt(420) < 0.1);
  assert.equal(peakCaption(5, 300), 'sharp');
  assert.equal(peakCaption(120, 300), 'adapting');
  assert.equal(peakCaption(300, 300), 'goal');
});

test('custom minutes stay within 1..90', () => {
  assert.equal(clampMinutes(0), 1);
  assert.equal(clampMinutes(200), 90);
  assert.equal(clampMinutes(7.4), 7);
});
