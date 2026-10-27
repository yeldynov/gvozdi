/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { needsConsent } from './consent.ts';

test('needsConsent: EU/EEA/UK/CH ask, everyone else and unknown do not', () => {
  for (const c of ['DE', 'pl', 'NO', 'GB', 'CH']) assert.equal(needsConsent(c), true, c);
  for (const c of ['UA', 'US', 'RU', 'XX', '', null, undefined]) assert.equal(needsConsent(c), false, String(c));
});
