/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { clampMinutes, elapsedSec, stepMinutes, pauseClock, peakCaption, peakIntensity, peakStage, resumeClock, startClock } from './session.ts';

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

test('peak: sharpest to 1:30, still stings to 7:00, then easier', () => {
  assert.deepEqual([0, 89, 90, 419, 420].map(peakStage), ['sharp', 'sharp', 'stings', 'stings', 'easier']);
  assert.equal(peakCaption(5, 300), 'sharp');
  assert.equal(peakCaption(80, 300), 'top');
  assert.equal(peakCaption(200, 300), 'past');
  assert.equal(peakCaption(450, 600), 'adapting');
  assert.equal(peakCaption(300, 300), 'goal');
  assert.equal(peakCaption(100, 120), 'top'); // a 2-min session is still at its peak at 1:40
  assert.deepEqual([12, 30, 50, 70].map((s) => peakCaption(s, 0)), ['exhale', 'climbing', 'soften', 'hold']);
});

test('peak intensity climbs to the top at 1:30, fades by 7:00, then is calm', () => {
  assert.equal(peakIntensity(0), 0);
  assert.ok(peakIntensity(10) > 0.2); // steep early climb
  assert.ok(peakIntensity(45) < peakIntensity(80));
  assert.equal(peakIntensity(90), 1);
  assert.ok(peakIntensity(300) < peakIntensity(120));
  assert.ok(peakIntensity(419) > 0.2 && peakIntensity(419) < 0.25);
  assert.equal(peakIntensity(420), 0);
});

test('custom minutes stay within 1..90', () => {
  assert.equal(clampMinutes(0), 1);
  assert.equal(clampMinutes(200), 90);
  assert.equal(clampMinutes(7.4), 7);
});

test('steps: ones up to 30, then fives, within 1..90', () => {
  assert.equal(stepMinutes(29, 1), 30);
  assert.equal(stepMinutes(30, 1), 35);
  assert.equal(stepMinutes(35, -1), 30);
  assert.equal(stepMinutes(30, -1), 29);
  assert.equal(stepMinutes(32, 1), 35);
  assert.equal(stepMinutes(32, -1), 30);
  assert.equal(stepMinutes(1, -1), 1);
  assert.equal(stepMinutes(90, 1), 90);
});
