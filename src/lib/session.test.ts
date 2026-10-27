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

test('peak curve tops out at 1:30, then eases by 7:00', () => {
  assert.equal(intensityAt(0), 0);
  assert.equal(intensityAt(90), 1);
  assert.ok(intensityAt(30) < intensityAt(60) && intensityAt(60) < intensityAt(89));
  assert.ok(intensityAt(91) < 1 && intensityAt(150) < intensityAt(91));
  assert.ok(intensityAt(420) < 0.2);
  assert.equal(peakCaption(5, 300), 'sharp');
  assert.equal(peakCaption(80, 300), 'top');
  assert.equal(peakCaption(200, 300), 'adapting');
  assert.equal(peakCaption(300, 300), 'goal');
  assert.equal(peakCaption(100, 120), 'top'); // a 2-min session is still at its peak at 1:40
});

test('custom minutes stay within 1..90', () => {
  assert.equal(clampMinutes(0), 1);
  assert.equal(clampMinutes(200), 90);
  assert.equal(clampMinutes(7.4), 7);
});
