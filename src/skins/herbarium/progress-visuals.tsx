import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import Svg, { Ellipse, G, Path } from 'react-native-svg';

import { look } from '@/components/progress-visuals';
import { herbFonts as fonts, space, useColors } from '@/theme';

// A linden drawn like a herbarium specimen, in a 100×100 viewBox with the soil line at y=82.
// One deterministic branching skeleton: each stage reveals more of the same tree, so growth reads continuously.
const SOIL = 82;
const rad = (d: number) => (d * Math.PI) / 180;
// Drawings 4..10 (with 6.5 in between): trunk height and width, and how many times the crown forks.
const GROWN = [4, 5, 6, 6.5, 7, 8, 9, 10];
const TRUNK = [30, 20, 21, 21.5, 22, 22, 22, 22];
const WIDTH = [1.6, 2.2, 3, 3.4, 3.8, 4.2, 4.2, 4.4];
const DEPTH = [0, 2, 3, 4, 4, 4, 4, 4];
const SPREAD = 26; // degrees between sibling branches
const RATIO = 0.74; // child branch length per level
const LEAF = 7.5;

/** Park–Miller generator: the same tree every render. */
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Heart-shaped linden leaf with its tip at (len, 0). */
const leafPath = (l: number) => `M0 0C${l * 0.1} ${-l * 0.62} ${l * 0.78} ${-l * 0.55} ${l} 0C${l * 0.78} ${l * 0.55} ${l * 0.1} ${l * 0.62} 0 0Z`;

type Ink = { leaf: string; wood: string; soil: string; vein: string; bloom: string };

const n = (v: number) => Math.round(v * 100) / 100;

/** The linden at `stage`. Geometry is merged into one path per colour and stroke width: a grown tree is
 *  ~10 SVG elements instead of ~1700, which Android (one native view per element) needs to repaint smoothly. */
function plant(stage: number, ink: Ink, key: string): ReactElement[] {
  let leaves = '';
  let veins = '';
  let wood = ''; // filled shapes in the wood colour (trunk, seed)
  let blooms = '';
  const sticks = new Map<number, string>(); // stroke width → path
  const front: ReactElement[] = []; // drawn last (the young tree)

  /** Heart-shaped linden leaf with its stem at (x, y), `len` long, turned `deg`, plus a vein from 6 up. */
  const leaf = (x: number, y: number, len: number, deg: number) => {
    const cos = Math.cos(rad(deg));
    const sin = Math.sin(rad(deg));
    const p = (px: number, py: number) => `${n(x + px * cos - py * sin)} ${n(y + px * sin + py * cos)}`;
    const l = len;
    leaves += `M${p(0, 0)}C${p(l * 0.1, -l * 0.62)} ${p(l * 0.78, -l * 0.55)} ${p(l, 0)}C${p(l * 0.78, l * 0.55)} ${p(l * 0.1, l * 0.62)} ${p(0, 0)}Z`;
    if (len >= 6) veins += `M${p(l * 0.14, 0)}L${p(l * 0.8, 0)}`;
  };
  const stick = (x1: number, y1: number, x2: number, y2: number, w: number, curve = 0) => {
    const key = n(w);
    sticks.set(key, (sticks.get(key) ?? '') + `M${n(x1)} ${n(y1)}Q${n((x1 + x2) / 2 + curve)} ${n((y1 + y2) / 2)} ${n(x2)} ${n(y2)}`);
  };

  const draw = () => {
    const out: ReactElement[] = [];
    if (wood) out.push(<Path key={`${key}w`} d={wood} fill={ink.wood} />);
    for (const [w, d] of sticks) out.push(<Path key={`${key}s${w}`} d={d} stroke={ink.wood} strokeWidth={w} strokeLinecap="round" fill="none" />);
    if (leaves) out.push(<Path key={`${key}l`} d={leaves} fill={ink.leaf} />);
    if (veins) out.push(<Path key={`${key}v`} d={veins} stroke={ink.vein} strokeWidth={0.6} strokeLinecap="round" opacity={0.85} />);
    if (blooms) out.push(<Path key={`${key}b`} d={blooms} fill={ink.bloom} />);
    return [...out, ...front];
  };

  // Soil line; roots show below it from Deep Roots (stage 8) on.
  const rx = 13 + Math.min(stage, 8) * 2.3;
  const soil = <Path key={`${key}g0`} d={`M${n(50 - rx)} ${SOIL}L${n(50 + rx)} ${SOIL}`} stroke={ink.soil} strokeWidth={1.8} strokeLinecap="round" />;
  if (stage >= 8) {
    for (const [a, l, w] of [[-62, 13, 1.3], [-30, 11, 1.1], [0, 10, 1.2], [28, 12, 1.1], [58, 14, 1.3]]) {
      stick(50, SOIL, 50 + Math.sin(rad(a)) * l, SOIL + Math.cos(rad(a)) * l * 0.62, w, a * 0.06);
    }
  }

  if (stage === 1) {
    // Seed (an ellipse as two arcs) and its first shoot.
    wood += `M46.4 ${SOIL - 3}a3.6 3.2 0 1 0 7.2 0a3.6 3.2 0 1 0 -7.2 0Z`;
    return [
      soil,
      ...draw(),
      <Path key={`${key}sh`} d={`M50.5 ${SOIL - 5.5}q1.5 -3 4 -3.6`} stroke={ink.leaf} strokeWidth={1.3} strokeLinecap="round" fill="none" />,
    ];
  }
  if (stage >= 2 && stage < 4) {
    // 2.5 and 3.5 are the in-between stems of the first week.
    const h = stage <= 3 ? 18 + (stage - 2) * 14 : 36;
    const L = stage === 2 ? 10 : 11;
    const stem = <Path key={`${key}st`} d={`M50 ${SOIL}Q46.5 ${n(SOIL - h * 0.55)} 50 ${SOIL - h}`} stroke={ink.wood} strokeWidth={stage === 2 ? 1.6 : 2} strokeLinecap="round" fill="none" />;
    if (stage >= 2.5) leaf(48.6, SOIL - h * 0.375, L * 0.9, 200);
    if (stage >= 3) leaf(49.4, SOIL - h * 0.66, L, -20);
    if (stage === 3.5) leaf(49.6, SOIL - h * 0.18, L * 0.8, -25);
    leaf(50, SOIL - h, L, -150);
    leaf(50, SOIL - h, L, -30);
    if (stage >= 3) leaf(50, SOIL - h, L * 0.8, -90);
    return [soil, stem, ...draw()];
  }
  if (stage < 4) return [soil];

  const i = GROWN.indexOf(Math.min(stage, 10));
  const T = TRUNK[i];
  const W = WIDTH[i];
  const depth = DEPTH[i];
  const r = rng(7);
  const top = SOIL - T;
  const tips: [number, number, number][] = [];
  const along: [number, number, number][] = [];

  wood += `M${n(50 - W)} ${SOIL}Q${n(50 - W * 0.5)} ${n(SOIL - T * 0.5)} ${n(50 - W * 0.32)} ${top}L${n(50 + W * 0.32)} ${top}Q${n(50 + W * 0.5)} ${n(SOIL - T * 0.5)} ${n(50 + W)} ${SOIL}Z`;
  if (depth === 0) {
    // Sapling: one leader with alternate leaves.
    stick(50, top, 50, top - 8, W * 0.4);
    for (let m = 0; m < 5; m++) along.push([50, SOIL - T * 0.3 - m * 8, m % 2 ? 1 : -1]);
    tips.push([50, top - 8, 0]);
  } else {
    const fork = (x: number, y: number, a: number, len: number, d: number, w: number) => {
      const x2 = x + Math.sin(rad(a)) * len;
      const y2 = y - Math.cos(rad(a)) * len;
      stick(x, y, x2, y2, w);
      if (d <= 1) along.push([(x + x2) / 2, (y + y2) / 2, a > 0 ? 1 : -1]);
      if (d === 0) return void tips.push([x2, y2, a]);
      for (const t of [-1, 0, 1]) fork(x2, y2, a * 0.75 + t * SPREAD + (r() - 0.5) * 10, len * RATIO, d - 1, w * 0.64);
    };
    for (const t of [-1, 0, 1]) fork(50, top, t * SPREAD * 0.9, 13 * (0.8 + 0.07 * depth), depth - 1, W * 0.6);
  }

  for (const [x, y, side] of along) leaf(x, y, LEAF * 0.85, side > 0 ? -25 : -155);
  for (const [x, y, a] of tips) for (const d of [-70, -35, 0, 35, 70]) leaf(x, y, LEAF * (d === 0 ? 1.08 : 1), a - 90 + d);

  if (stage === 10) {
    // Tree in Bloom: pale linden blossom under every other tip.
    tips.forEach(([x, y], m) => {
      if (m % 2) return;
      for (const [dx, dy] of [[-1.6, 2.6], [0.4, 3.6], [1.9, 2.2]]) blooms += `M${n(x + dx - 1.25)} ${n(y + dy)}a1.25 1.25 0 1 0 2.5 0a1.25 1.25 0 1 0 -2.5 0Z`;
    });
  }
  if (stage >= 9) {
    // Keeper of the Grove: a young linden beside it.
    const s = 0.5;
    front.push(
      <G key={`${key}y`} transform={`translate(${84 - 50 * s} ${SOIL - SOIL * s}) scale(${s})`}>
        {plant(4, ink, `${key}g`)}
      </G>,
    );
  }
  return [soil, ...draw()];
}

/** A square around the plant at `stage`, sitting a little below the soil line. */
/** The linden grown to `stage` (0 bare soil, 1 seed … 12 with a young tree beside it, 13 in bloom); all grey when `muted`.
 *  Every stage shares one scale, so growth is visible. */
export function Tree({ stage, size = 120, muted, soil = true }: { stage: number; size?: number; muted?: boolean; soil?: boolean }) {
  const c = useColors();
  const ink: Ink = muted
    ? { leaf: c.text3, wood: c.text3, soil: c.text3, vein: c.surface, bloom: c.surface }
    : { leaf: c.success, wood: c.text2, soil: c.illus, vein: c.surface, bloom: c.accent };
  if (!soil) ink.soil = 'none'; // drawn on a shared soil line instead
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {plant(look(stage), ink, 't')}
    </Svg>
  );
}

/** The tree at `stage`, fading in over the stage before it; replays whenever `stage` changes. */
export function TreeGrow({ stage, size, ms = 500, delay = 0 }: { stage: number; size: number; ms?: number; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <View style={{ width: size, height: size }}>
      {stage > 0 && !reduced && (
        <View style={StyleSheet.absoluteFill}>
          <Tree stage={stage - 1} size={size} />
        </View>
      )}
      <Animated.View key={stage} entering={reduced ? undefined : FadeIn.duration(ms).delay(delay)} style={StyleSheet.absoluteFill}>
        <Tree stage={stage} size={size} />
      </Animated.View>
    </View>
  );
}

/** Minutes per day as stems on the soil line, oldest first: a leaf at the tip on practised days, a seed on rest days.
 *  Weekday letters under each stem when `labels`; more than 10 days draws a fine meadow. */
export function Meadow({
  data,
  label,
  height = 104,
  labels,
}: {
  data: { day: string; minutes: number }[];
  label: string;
  height?: number;
  labels?: boolean;
}) {
  const c = useColors();
  const { i18n } = useTranslation();
  const [w, setW] = useState(0);
  const fine = data.length > 10;
  const L = fine ? 9 : 16; // tip leaf length
  const soil = height - 2;
  const max = Math.max(10, ...data.map((d) => d.minutes));
  const step = w / data.length;
  const today = data.length - 1;
  return (
    <View accessible accessibilityLabel={label} style={{ gap: space[1] }}>
      <View style={{ height }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {w > 0 && (
          <Svg width={w} height={height}>
            <Path d={`M1 ${soil}H${w - 1}`} stroke={c.illus} strokeWidth={1.5} strokeLinecap="round" />
            {data.map((d, i) => {
              const x = (i + 0.5) * step;
              if (!d.minutes) return <Ellipse key={d.day} cx={x} cy={soil - 2.5} rx={fine ? 1.4 : 2.4} ry={fine ? 1.2 : 2} fill={c.text3} opacity={0.6} />;
              const h = Math.max(L * 0.6, (d.minutes / max) * (soil - L - 2));
              const side = i % 2 ? 1 : -1; // stems lean alternately, like grass
              const tx = x + side * (fine ? 1 : 2.5);
              const ty = soil - h;
              const cx = x - side * (fine ? 1 : 2);
              const mx = (x + 2 * cx + tx) / 4;
              const my = (soil + 2 * (soil - h / 2) + ty) / 4;
              return (
                <G key={d.day}>
                  <Path d={`M${x} ${soil}Q${cx} ${soil - h / 2} ${tx} ${ty}`} stroke={c.success} strokeWidth={fine ? 2.5 : 3.5} strokeLinecap="round" fill="none" />
                  {!fine && h > 40 && (
                    <G transform={`translate(${mx} ${my}) rotate(${-90 - side * 55})`}>
                      <Path d={leafPath(L * 0.7)} fill={c.success} />
                    </G>
                  )}
                  <G transform={`translate(${tx} ${ty}) rotate(${-90 + side * 25})`}>
                    <Path d={leafPath(L)} fill={c.primary} />
                  </G>
                </G>
              );
            })}
          </Svg>
        )}
      </View>
      {labels && (
        <View style={styles.row}>
          {data.map((d, i) => {
            const [y, m, day] = d.day.split('-').map(Number);
            return (
              <Text key={d.day} style={[styles.day, { color: i === today ? c.text : c.text2 }, i === today && { fontFamily: fonts.textBold }]}>
                {new Date(y, m - 1, day).toLocaleDateString(i18n.language, { weekday: 'narrow' })}
              </Text>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  day: { flex: 1, textAlign: 'center', fontFamily: fonts.textMedium, fontSize: 12 },
});
