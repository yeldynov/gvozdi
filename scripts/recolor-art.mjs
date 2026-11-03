// Recolor the earthy onboarding art (assets/art/*.svg) into each skin's palette from src/lib/art-palette.ts.
// Usage: node scripts/recolor-art.mjs   (writes assets/art/<skin>/*.svg; rerun after changing a palette)
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ART } from '../src/lib/art-palette.ts';

// Ink: an ensō around the aura, as Blob draws it in scenes.tsx.
const arc = (cx, cy, rx, ry, a0, a1) =>
  'M' + Array.from({ length: 41 }, (_, i) => {
    const t = ((a0 + ((a1 - a0) * i) / 40) * Math.PI) / 180;
    return `${(cx + rx * Math.cos(t)).toFixed(1)} ${(cy + ry * Math.sin(t)).toFixed(1)}`;
  }).join('L');
const enso = (cx, cy, rx, ry, ink) =>
  `<g fill="none" stroke-linecap="round"><path d="${arc(cx, cy, rx, ry, -100, 220)}" stroke="${ink}" stroke-width="7" opacity="0.78"/>` +
  `<path d="${arc(cx, cy, rx * 0.985, ry * 0.985, 200, 252)}" stroke="${ink}" stroke-width="3" opacity="0.6"/></g>`;
const flat = (p) => [...Object.values(p.GV), p.SKIN, p.INK, ...Object.values(p.HAIRS), p.GREY, p.MIST, p.PHONE, p.SCREEN, p.SAND];
const from = flat(ART.earthy).map((h) => h.toUpperCase());
const dir = 'assets/art';
const files = readdirSync(dir).filter((f) => f.endsWith('.svg'));

for (const skin of ['ink', 'dusk']) {
  const to = flat(ART[skin]);
  const map = new Map(from.map((h, i) => [h, to[i]]));
  mkdirSync(join(dir, skin), { recursive: true });
  for (const f of files) {
    let svg = readFileSync(join(dir, f), 'utf8').replace(/#[0-9a-fA-F]{6}\b/g, (h) => map.get(h.toUpperCase()) ?? h);
    if (skin === 'ink') svg = svg.replace(/^(<svg[^>]*>)(<ellipse cx="([\d.]+)" cy="([\d.]+)" rx="([\d.]+)" ry="([\d.]+)"[^>]*><\/ellipse>)/, (_, open, aura, cx, cy, rx, ry) => open + aura + enso(+cx, +cy, +rx, +ry, ART.ink.INK));
    writeFileSync(join(dir, skin, f), svg);
  }
  console.log(skin, files.length, 'files');
}
