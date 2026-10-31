import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { intensityAt, MILD_SEC, PEAK_SEC } from '@/lib/session';
import { herbFonts as fonts, useColors } from '@/theme';

/** Soft disc that swells and settles on a 4s in / 4s out rhythm. */
export function BreathDot({
  size,
  active,
  color,
  opacity = 0.35,
}: {
  size: number;
  active: boolean;
  color: string;
  opacity?: number;
}) {
  const scale = useSharedValue(0.8);
  useEffect(() => {
    if (!active) return cancelAnimation(scale);
    scale.value = withRepeat(withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(scale);
  }, [active, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity }, style]}
    />
  );
}

const RING = 280;
const R = 124;
const C = 2 * Math.PI * R;
// Nail-board field inside the ring: a hex grid of points, faint at the centre so the digits stay readable.
const NAILS = (() => {
  const out: { x: number; y: number; o: number }[] = [];
  const step = 13;
  const max = R - 18;
  for (let row = -10; row <= 10; row++) {
    const y = row * step * 0.866;
    for (let col = -10; col <= 10; col++) {
      const x = col * step + (row % 2 ? step / 2 : 0);
      const d = Math.hypot(x, y);
      if (d <= max) out.push({ x: 140 + x, y: 140 + y, o: 0.06 + 0.4 * (d / max) ** 2 });
    }
  }
  return out;
})();

// Slim leaf, base at 0,0 pointing along +x.
const LEAF = 'M0 0C3 -6.5 11 -6 17 0C11 6 3 6.5 0 0Z';

/** Progress as a stem growing round a nail-board field, a leaf at its tip; the centre breathes while running. */
export function TimerRing({
  progress,
  color,
  running,
  children,
}: {
  progress: number;
  color: string;
  running: boolean;
  children: ReactNode;
}) {
  const c = useColors();
  const p = Math.min(1, progress);
  const a = p * 2 * Math.PI - Math.PI / 2;
  const tip = { x: 140 + Math.cos(a) * R, y: 140 + Math.sin(a) * R };
  const deg = (a * 180) / Math.PI + 90; // tangent: the way the stem grows
  const arc = { cx: 140, cy: 140, r: R, fill: 'none', stroke: color, strokeDasharray: `${C} ${C}`, strokeDashoffset: C * (1 - p), strokeLinecap: 'round' as const, transform: 'rotate(-90 140 140)' };
  return (
    <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING} height={RING} viewBox="0 0 280 280" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="ringcore" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={c.bg} stopOpacity={0.9} />
            <Stop offset="1" stopColor={c.bg} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {NAILS.map((n, i) => (
          <Circle key={i} cx={n.x} cy={n.y} r={1.6} fill={c.text3} opacity={n.o * 0.8} />
        ))}
        <Circle cx={140} cy={140} r={70} fill="url(#ringcore)" />
        <Circle cx={140} cy={140} r={R} fill="none" stroke={c.bg3} strokeWidth={2} />
        <Circle {...arc} strokeWidth={3.5} />
        {p > 0 && <Path d={LEAF} fill={color} transform={`translate(${tip.x} ${tip.y}) rotate(${deg - 40})`} />}
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <BreathDot size={110} active={running} color={color} opacity={0.1} />
      </View>
      {children}
    </View>
  );
}

const W = 296;
const H = 200;
const PAD = 8;
const N = 60;

/** Expected intensity over the session, with the travelled part highlighted. */
export function PeakCurve({ elapsed, total }: { elapsed: number; total: number }) {
  const c = useColors();
  const x = (t: number) => PAD + (t / total) * (W - PAD * 2);
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const t = (i / N) * total;
    return [x(t), H - PAD - intensityAt(t) * (H - PAD * 2)] as const;
  });
  const line = (p: readonly (readonly [number, number])[]) =>
    p.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
  const idx = Math.min(N, Math.round((Math.min(elapsed, total) / total) * N));
  const travelled = pts.slice(0, idx + 1);
  const [mx, my] = pts[idx];
  const fill = `M${PAD} ${H - PAD} ${line(travelled).replace('M', 'L')} L${mx.toFixed(1)} ${H - PAD} Z`;
  const marker = (t: number, color: string, label: string) =>
    t < total && (
      <>
        <Line x1={x(t)} y1={PAD + 8} x2={x(t)} y2={H - PAD} stroke={color} strokeWidth={1} strokeDasharray="3 4" opacity={0.5} />
        <SvgText x={x(t)} y={PAD + 2} fill={color} fontSize={9} fontFamily={fonts.textBold} textAnchor="middle">
          {label}
        </SvgText>
      </>
    );

  return (
    <View style={{ width: '100%', aspectRatio: W / H }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="peakfill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={c.primary} stopOpacity={0.22} />
            <Stop offset="1" stopColor={c.primary} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>
        <Line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={c.illus} strokeWidth={2.5} strokeLinecap="round" />
        {marker(PEAK_SEC, c.error, '1:30')}
        {marker(MILD_SEC, c.success, '7:00')}
        <Path d={fill} fill="url(#peakfill)" />
        <Path d={line(pts)} fill="none" stroke={c.text3} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
        <Path d={line(travelled)} fill="none" stroke={c.primary} strokeWidth={3} strokeLinecap="round" />
        <Circle cx={mx} cy={my} r={4.5} fill={c.primary} stroke={c.bg} strokeWidth={2} />
      </Svg>
    </View>
  );
}
