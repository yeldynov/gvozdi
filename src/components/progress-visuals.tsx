import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { Art } from '@/components/ui';
import { achievementStage, type Achievement } from '@/lib/practice';
import { fonts, radius, space, useColors } from '@/theme';

// Crown blobs as [dx, dy, r] in crown-radius units; later stages use more of them.
const CROWN = [
  [0, 0, 1], [-0.75, 0.25, 0.8], [0.75, 0.25, 0.8], [-0.4, -0.6, 0.8], [0.45, -0.55, 0.75],
  [-1.2, -0.15, 0.6], [1.2, -0.1, 0.6], [0, -1.05, 0.7], [-0.85, 0.8, 0.55], [0.85, 0.8, 0.55],
];
// Stages 4..9 as [trunk height, crown radius, blobs]; 1 seed, 2 sprout, 3 seedling.
const TREES: Record<number, number[]> = {
  4: [22, 9, 3], 5: [28, 11, 5], 6: [34, 13, 7], 7: [38, 15, 8], 8: [42, 17, 10], 9: [43, 18.5, 10], 10: [44, 19.5, 10],
};
const G = 82; // ground line in the 100×100 viewBox
const groundRx = (stage: number) => 14 + stage * 2.5;

/** Where the ground ellipse ends, as fractions of the Tree's size: its right edge and its bottom. */
export const treeGround = (stage: number) => ({ right: (50 + groundRx(stage)) / 100, bottom: (G + 8) / 100 });

/** A tree grown to `stage` (0 bare ground, 1 seed … 9 old tree, 10 in bloom); all grey when `muted`. */
export function Tree({ stage, size = 120, muted }: { stage: number; size?: number; muted?: boolean }) {
  const c = useColors();
  const leafColor = muted ? c.text3 : c.success;
  const wood = muted ? c.text3 : c.text2;
  const leaf = (x: number, y: number, len: number, deg: number, k: string) => (
    <Ellipse key={k} cx={x + len / 2} cy={y} rx={len / 2} ry={len / 4.5} fill={leafColor} transform={`rotate(${deg} ${x} ${y})`} />
  );
  const tree = TREES[stage];
  let plant = null;
  if (stage === 1) plant = <Ellipse cx={50} cy={G - 1} rx={4} ry={3} fill={wood} />;
  else if (stage === 2 || stage === 3) {
    const h = stage === 2 ? 14 : 24;
    plant = (
      <>
        <Path d={`M50 ${G} Q48 ${G - h / 2} 50 ${G - h}`} stroke={wood} strokeWidth={1.6} fill="none" />
        {stage === 3 && [leaf(49.5, G - 11, 10, -20, 'a'), leaf(49.5, G - 11, 10, -160, 'b'), leaf(50, G - h, 7, -90, 'c')]}
        {leaf(50, G - h, stage === 2 ? 9 : 11, -30, 'd')}
        {leaf(50, G - h, stage === 2 ? 9 : 11, -150, 'e')}
      </>
    );
  } else if (tree) {
    const [h, r, n] = tree;
    const w0 = 1.5 + stage * 0.6;
    const w1 = w0 * 0.45;
    const cy = G - h;
    plant = (
      <>
        {stage >= 8 && (
          <Path d={`M${50 - w0} ${G} q-4 1 -8 3 M${50 + w0} ${G} q4 1 8 3`} stroke={wood} strokeWidth={1.4} fill="none" />
        )}
        {stage >= 6 && (
          <Path
            d={`M50 ${G - h * 0.5} Q${50 - r * 0.4} ${cy + r * 0.4} ${50 - r * 0.8} ${cy + r * 0.1} M50 ${G - h * 0.6} Q${50 + r * 0.4} ${cy + r * 0.5} ${50 + r * 0.85} ${cy + r * 0.15}`}
            stroke={wood}
            strokeWidth={1.8}
            fill="none"
          />
        )}
        <Path
          d={`M${50 - w0} ${G} Q${50 - w1} ${G - h / 2} ${50 - w1} ${cy} L${50 + w1} ${cy} Q${50 + w1} ${G - h / 2} ${50 + w0} ${G} Z`}
          fill={wood}
        />
        {CROWN.slice(0, n).map(([dx, dy, k], i) => (
          <Circle key={i} cx={50 + dx * r} cy={cy + dy * r} r={k * r} fill={leafColor} fillOpacity={i % 2 ? 0.85 : 1} />
        ))}
        {stage === 10 &&
          CROWN.slice(1, 8).map(([dx, dy], i) => (
            <Circle key={`b${i}`} cx={50 + dx * r * 0.9} cy={cy + dy * r * 0.9} r={1.8} fill={muted ? c.surface : c.accent} />
          ))}
      </>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Ellipse cx={50} cy={G + 3} rx={groundRx(stage)} ry={5} fill={muted ? c.text3 : c.illus} fillOpacity={0.45} />
      {plant}
    </Svg>
  );
}

/** Loop: the Practice-screen figure stands on the nail board while the tree beside them grows from seed to bloom. Static full tree on reduced motion. */
export function GrowingTree({ size = 140 }: { size?: number }) {
  const reduced = useReducedMotion();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setTick((n) => (n + 1) % 14), 700); // ticks 10..13 hold the full tree
    return () => clearInterval(id);
  }, [reduced]);
  const stage = reduced ? 10 : Math.min(tick, 10);
  return (
    <View aria-hidden style={{ flexDirection: 'row', justifyContent: 'center' }}>
      <Art name="stand" size={size} />
      <TreeGrow stage={stage} size={size} />
    </View>
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

/** Round badge showing the tree stage this achievement grows; muted until earned. */
export function Badge({ a, earned, size = 56 }: { a: Achievement; earned: boolean; size?: number }) {
  const c = useColors();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        borderColor: earned ? c.success : c.divider,
        backgroundColor: c.surface,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: earned ? 1 : 0.55,
      }}>
      <Tree stage={achievementStage(a)} size={size * 0.9} muted={!earned} />
    </View>
  );
}

/** Minutes per day as bars, today highlighted; weekday letters under each bar when `labels`. */
export function DayBars({
  data,
  label,
  height = 72,
  labels,
}: {
  data: { day: string; minutes: number }[];
  label: string;
  height?: number;
  labels?: boolean;
}) {
  const c = useColors();
  const { i18n } = useTranslation();
  const max = Math.max(10, ...data.map((d) => d.minutes));
  return (
    <View accessible accessibilityLabel={label} style={[styles.row, { gap: data.length > 10 ? 3 : space[2] }]}>
      {data.map((d, i) => {
        const [y, m, day] = d.day.split('-').map(Number);
        return (
          <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: space[1] }}>
            <View style={{ height, width: '100%', justifyContent: 'flex-end' }}>
              <View
                style={{
                  height: Math.max(3, (d.minutes / max) * height),
                  borderRadius: 3,
                  backgroundColor: !d.minutes ? c.text3 : i === data.length - 1 ? c.accent : c.primary,
                  opacity: d.minutes ? 1 : 0.25,
                }}
              />
            </View>
            {labels && (
              <Text style={[styles.day, { color: c.text2 }]}>
                {new Date(y, m - 1, day).toLocaleDateString(i18n.language, { weekday: 'narrow' })}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  day: { fontFamily: fonts.textMedium, fontSize: 11 },
});
