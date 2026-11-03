import type { ReactElement } from 'react';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import type { Colors } from '@/theme';

// A sumi-e pine in the shared 100×100 viewBox, ground at y=82: a brush-stroke trunk, foliage as pine-green pads over an
// ink wash with needle strokes. Stage 9 plants a young pine beside it; in bloom (10) a vermilion sun rises behind it.
const G0 = 82;
const H: Record<number, number> = { 4: 24, 5: 30, 6: 35, 6.5: 37, 7: 39, 8: 42, 9: 43, 10: 44 };
const PADS: Record<number, number> = { 4: 1, 5: 2, 6: 3, 6.5: 4, 7: 4, 8: 5, 9: 5, 10: 5 };
// Foliage pads as [height fraction up the trunk, side, branch length, pad width]; later stages use more of them.
const PAD = [[1, 0, 0, 12], [0.7, -1, 15, 10], [0.58, 1, 16, 10], [0.42, -1, 19, 9], [0.84, 1, 11, 8]] as const;

type Ink = { ink: string; leaf: string; seal: string };

/** Fan of pine needles rising from (x, y). */
function tuft(x: number, y: number, r: number, color: string, key: string) {
  return (
    <G key={key} stroke={color} strokeWidth={0.9} strokeLinecap="round">
      {[-60, -35, -12, 12, 35, 60].map((d) => {
        const a = ((d - 90) * Math.PI) / 180;
        return <Line key={d} x1={x} y1={y} x2={x + Math.cos(a) * r} y2={y + Math.sin(a) * r} />;
      })}
    </G>
  );
}

export function pine(stage: number, k: Ink, key: string, groundRx: number): ReactElement[] {
  const out: ReactElement[] = [];
  let id = 0;
  const n = () => `${key}${id++}`;
  // Ground: one dry brush stroke, heavy on the left, trailing off right.
  out.push(<Path key={n()} d={`M${50 - groundRx} ${G0 + 3}Q${50 - groundRx * 0.3} ${G0 - 0.5} ${50 + groundRx} ${G0 + 2}Q${50} ${G0 + 5} ${50 - groundRx} ${G0 + 3}Z`} fill={k.ink} opacity={0.5} />);

  if (stage === 1) {
    out.push(<Ellipse key={n()} cx={50} cy={G0 - 1} rx={3.6} ry={2.8} fill={k.ink} />);
    return out;
  }
  if (stage >= 2 && stage < 4) {
    const h = { 2: 13, 2.5: 18, 3: 23, 3.5: 27 }[stage] ?? 13;
    out.push(<Path key={n()} d={`M50 ${G0}Q47.5 ${G0 - h / 2} 50.5 ${G0 - h}`} stroke={k.ink} strokeWidth={1.8} strokeLinecap="round" fill="none" />);
    out.push(tuft(50.5, G0 - h, 6, k.leaf, n()));
    if (stage >= 2.5) out.push(tuft(49, G0 - h * 0.6, 4.5, k.leaf, n()));
    if (stage >= 3) out.push(tuft(49.8, G0 - h * 0.82, 5, k.ink, n()));
    if (stage === 3.5) out.push(tuft(49.2, G0 - h * 0.35, 4, k.leaf, n()));
    return out;
  }
  if (stage < 4) return out;

  const h = H[Math.min(stage, 10)];
  const w0 = 1.4 + stage * 0.5;
  const lean = 5;
  const top = G0 - h;
  const xAt = (t: number) => 50 + lean * t * t - Math.sin(Math.PI * t) * 2.5;

  if (stage === 10) {
    out.push(<Circle key={n()} cx={70} cy={top + 6} r={13} fill={k.seal} opacity={0.9} />);
  }
  if (stage >= 8) {
    // Roots: three short brush strokes into the ground.
    out.push(<Path key={n()} d={`M${50 - w0} ${G0}q-5 0 -10 3 M${50 + w0} ${G0}q5 0 9 2.5 M50 ${G0}q-1 2 -3 4`} stroke={k.ink} strokeWidth={1.4} strokeLinecap="round" fill="none" />);
  }
  // Trunk: a tapered brush stroke with a gentle S.
  const w1 = w0 * 0.35;
  out.push(
    <Path
      key={n()}
      d={`M${50 - w0} ${G0}C${46 - w0} ${G0 - h * 0.35} ${57 - w1} ${G0 - h * 0.68} ${xAt(1) - w1} ${top}L${xAt(1) + w1} ${top}C${57 + w1} ${G0 - h * 0.68} ${46 + w0} ${G0 - h * 0.35} ${50 + w0} ${G0}Z`}
      fill={k.ink}
    />,
  );
  const grow = 0.75 + (Math.min(stage, 10) - 4) * 0.05;
  for (const [t, side, len, w] of PAD.slice(0, PADS[Math.min(stage, 10)])) {
    const bx = xAt(t);
    const by = G0 - h * t;
    const px = bx + side * len * grow;
    const py = by - 2.5;
    if (side) out.push(<Path key={n()} d={`M${bx} ${by}Q${bx + side * len * 0.5 * grow} ${by - 4} ${px} ${py}`} stroke={k.ink} strokeWidth={1.3} strokeLinecap="round" fill="none" />);
    const rx = w * grow;
    out.push(<Ellipse key={n()} cx={px + 1.2} cy={py + 1.2} rx={rx} ry={rx * 0.42} fill={k.ink} opacity={0.16} />);
    out.push(<Ellipse key={n()} cx={px} cy={py} rx={rx * 0.92} ry={rx * 0.36} fill={k.leaf} />);
    out.push(
      <G key={n()} stroke={k.ink} strokeWidth={0.7} strokeLinecap="round" opacity={0.55}>
        {[-0.6, -0.2, 0.2, 0.6].map((f) => (
          <Line key={f} x1={px + f * rx} y1={py - rx * 0.2} x2={px + f * rx + 1.5} y2={py - rx * 0.42} />
        ))}
      </G>,
    );
  }
  if (stage >= 9) {
    // A young pine beside it.
    const s = 0.45;
    out.push(
      <G key={n()} transform={`translate(${83 - 50 * s} ${G0 - G0 * s}) scale(${s})`}>
        {pine(5, k, `${key}y`, 0)}
      </G>,
    );
  }
  if (stage === 10) {
    // The seal: a small vermilion stamp, as on a finished painting.
    out.push(<Rect key={n()} x={14} y={G0 - 13} width={6} height={7} rx={0.6} fill={k.seal} />);
  }
  return out;
}

export function inkColors(c: Colors, muted?: boolean): Ink {
  return muted ? { ink: c.text3, leaf: c.text3, seal: c.text3 } : { ink: c.text, leaf: c.success, seal: c.accent };
}
