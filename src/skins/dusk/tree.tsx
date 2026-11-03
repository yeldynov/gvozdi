import type { ReactElement } from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';

import type { Colors } from '@/theme';

// A weeping willow at dusk in the shared 100×100 viewBox, ground at y=82: strands droop from the crown and grow longer
// with each stage, fireflies gather from stage 6, a young willow joins at 9, and in bloom (10) a crescent moon rises.
const G0 = 82;
const H: Record<number, number> = { 4: 18, 5: 21, 6: 24, 6.5: 25, 7: 26, 8: 28, 9: 29, 10: 30 };
const STRANDS: Record<number, number> = { 4: 4, 5: 6, 6: 8, 6.5: 9, 7: 10, 8: 12, 9: 12, 10: 12 };
// Firefly spots around the crown, in order of appearance.
const FLIES = [[28, 44], [74, 38], [36, 28], [68, 58], [22, 62], [80, 22], [56, 18]] as const;

type Dusk = { leaf: string; wood: string; ground: string; glow: string };

export function willow(stage: number, k: Dusk, key: string, groundRx: number): ReactElement[] {
  const out: ReactElement[] = [];
  let id = 0;
  const n = () => `${key}${id++}`;
  if (groundRx) out.push(<Ellipse key={n()} cx={50} cy={G0 + 3} rx={groundRx} ry={5} fill={k.ground} fillOpacity={0.45} />);

  if (stage === 1) {
    out.push(<Ellipse key={n()} cx={50} cy={G0 - 1} rx={4} ry={3} fill={k.wood} />);
    return out;
  }
  // One hanging strand from (x, y), `len` long, drifting a little toward `side`; leaves as a dashed second stroke.
  const strand = (x: number, y: number, side: number, len: number) => {
    const d = `M${x} ${y}C${x + side * 2.5} ${y + len * 0.3} ${x + side * 3.5} ${y + len * 0.65} ${x + side * 2.5} ${y + len}`;
    out.push(<Path key={n()} d={d} stroke={k.leaf} strokeWidth={0.8} fill="none" strokeLinecap="round" />);
    out.push(<Path key={n()} d={d} stroke={k.leaf} strokeWidth={2.6} fill="none" strokeDasharray="1.6 1.8" opacity={0.85} />);
  };
  if (stage >= 2 && stage < 4) {
    const h = { 2: 14, 2.5: 19, 3: 24, 3.5: 28 }[stage] ?? 14;
    out.push(<Path key={n()} d={`M50 ${G0}Q48 ${G0 - h / 2} 50 ${G0 - h}`} stroke={k.wood} strokeWidth={1.6} fill="none" strokeLinecap="round" />);
    out.push(<Path key={n()} d={`M50 ${G0 - h}q-3 -3 -6 -1 M50 ${G0 - h}q3 -3 6 -1`} stroke={k.wood} strokeWidth={1} fill="none" strokeLinecap="round" />);
    const count = { 2: 2, 2.5: 3, 3: 4, 3.5: 5 }[stage] ?? 2;
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1;
      strand(50 + side * (2 + i * 1.2), G0 - h - 1, side, h * (0.35 + 0.08 * i));
    }
    return out;
  }
  if (stage < 4) return out;

  const s = Math.min(stage, 10);
  const h = H[s];
  const top = G0 - h;
  const w0 = 1.5 + stage * 0.55;

  if (stage === 10) {
    // Crescent moon: outer arc, then a smaller inner arc back.
    const [mx, my, r] = [80, 16, 9];
    out.push(<Path key={n()} d={`M${mx} ${my - r}A${r} ${r} 0 1 0 ${mx} ${my + r}A${r * 0.72} ${r} 0 1 1 ${mx} ${my - r}Z`} fill={k.glow} opacity={0.9} />);
  }
  out.push(
    <Path
      key={n()}
      d={`M${50 - w0} ${G0}Q${49 - w0 * 0.3} ${G0 - h / 2} ${48.5} ${top}L${51.5} ${top}Q${51 + w0 * 0.3} ${G0 - h / 2} ${50 + w0} ${G0}Z`}
      fill={k.wood}
    />,
  );
  // Two limbs rise and arch outward; the strands hang from points along them.
  const reach = 9 + (s - 4) * 2.2;
  const rise = 9 + (s - 4) * 1.6;
  const ctrl = (side: number) => [50 + side * reach * 0.35, top - rise * 1.6, 50 + side * reach, top - rise * 0.4];
  /** Point at `f` (0 trunk … 1 tip) along a limb. */
  const limb = (side: number, f: number): [number, number] => {
    const [cx, cy, x1, y1] = ctrl(side);
    const u = 1 - f;
    return [u * u * 50 + 2 * u * f * cx + f * f * x1, u * u * top + 2 * u * f * cy + f * f * y1];
  };
  for (const side of [-1, 1]) {
    const [cx, cy, x1, y1] = ctrl(side);
    out.push(<Path key={n()} d={`M50 ${top}Q${cx} ${cy} ${x1} ${y1}`} stroke={k.wood} strokeWidth={1.5} fill="none" strokeLinecap="round" />);
  }
  const per = STRANDS[s] / 2;
  for (const side of [-1, 1]) {
    for (let i = 0; i < per; i++) {
      const f = 0.15 + (0.85 * i) / Math.max(1, per - 1);
      const [x, y] = limb(side, f);
      // Longest near the middle of each limb, never reaching the ground.
      const len = Math.min(G0 - 8 - y, (h * 0.55 + rise) * (0.7 + 0.3 * Math.sin(Math.PI * f)));
      strand(x, y, side, len);
    }
  }
  if (stage >= 9) {
    const sc = 0.45;
    out.push(
      <G key={n()} transform={`translate(${84 - 50 * sc} ${G0 - G0 * sc}) scale(${sc})`}>
        {willow(5, k, `${key}y`, 0)}
      </G>,
    );
  }
  const flies = stage >= 6 ? (stage === 10 ? 7 : Math.min(4, Math.floor(stage - 5))) : 0;
  for (const [x, y] of FLIES.slice(0, flies)) {
    out.push(<Circle key={n()} cx={x} cy={y} r={3} fill={k.glow} opacity={0.22} />);
    out.push(<Circle key={n()} cx={x} cy={y} r={1.2} fill={k.glow} />);
  }
  return out;
}

export function duskColors(c: Colors, muted?: boolean): Dusk {
  return muted ? { leaf: c.text3, wood: c.text3, ground: c.text3, glow: c.text3 } : { leaf: c.success, wood: c.text2, ground: c.illus, glow: c.accent };
}
