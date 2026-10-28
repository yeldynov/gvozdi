import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { intensityAt, MILD_SEC, PEAK_SEC } from '@/lib/session';
import { fonts, useColors } from '@/theme';

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
const TICKS = Array.from({ length: 60 }, (_, i) => {
  const a = (i / 60) * 2 * Math.PI - Math.PI / 2;
  return { i, x1: 140 + Math.cos(a) * (R - 8), y1: 140 + Math.sin(a) * (R - 8), x2: 140 + Math.cos(a) * (R - 4), y2: 140 + Math.sin(a) * (R - 4) };
});
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

/** A ring that expands from the timer and fades, like a gong tone travelling out. */
function Ripple({ color, delay, active }: { color: string; delay: number; active: boolean }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!active || reduced) {
      cancelAnimation(t);
      t.value = 0;
      return;
    }
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 6000, easing: Easing.out(Easing.quad) }), -1, false));
    return () => cancelAnimation(t);
  }, [active, reduced, delay, t]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.1, 1], [0, 0.35, 0]),
    transform: [{ scale: interpolate(t.value, [0, 1], [1, 1.3]) }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.ripple, { borderColor: color }, style]} />;
}

/** Progress ring over a nail-board field, with breathing glow, travelling ripples and a glowing tip. */
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
  const arc = { cx: 140, cy: 140, r: R, fill: 'none', stroke: color, strokeDasharray: `${C} ${C}`, strokeDashoffset: C * (1 - p), strokeLinecap: 'round' as const, transform: 'rotate(-90 140 140)' };
  return (
    <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 2000, 4000].map((d) => (
        <Ripple key={d} color={color} delay={d} active={running} />
      ))}
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <BreathDot size={RING - 40} active={running} color={color} opacity={0.08} />
      </View>
      <Svg width={RING} height={RING} viewBox="0 0 280 280" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="ringcore" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={c.bg} stopOpacity={0.9} />
            <Stop offset="1" stopColor={c.bg} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {NAILS.map((n, i) => (
          <Circle key={i} cx={n.x} cy={n.y} r={1.6} fill={c.text3} opacity={n.o} />
        ))}
        <Circle cx={140} cy={140} r={70} fill="url(#ringcore)" />
        <Circle cx={140} cy={140} r={R} fill="none" stroke={c.bg3} strokeWidth={2} />
        {TICKS.map((t) => (
          <Line key={t.i} {...t} stroke={c.text3} strokeWidth={1} opacity={t.i % 5 === 0 ? 0.6 : 0.25} />
        ))}
        <Circle {...arc} strokeWidth={12} opacity={0.12} />
        <Circle {...arc} strokeWidth={3} />
        {p > 0 && (
          <>
            <Circle cx={tip.x} cy={tip.y} r={11} fill={color} opacity={0.18} />
            <Circle cx={tip.x} cy={tip.y} r={5} fill={color} stroke={c.bg} strokeWidth={2} />
          </>
        )}
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <BreathDot size={110} active={running} color={color} opacity={0.12} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  ripple: { position: 'absolute', width: R * 2, height: R * 2, borderRadius: R, borderWidth: 1.5, left: 140 - R, top: 140 - R },
});

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
            <Stop offset="0" stopColor={c.accent} stopOpacity={0.3} />
            <Stop offset="1" stopColor={c.accent} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>
        <Line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={c.divider} strokeWidth={1} />
        {marker(PEAK_SEC, c.error, '1:30')}
        {marker(MILD_SEC, c.success, '7:00')}
        <Path d={fill} fill="url(#peakfill)" />
        <Path d={line(pts)} fill="none" stroke={c.accent} strokeWidth={2.5} strokeLinecap="round" opacity={0.45} />
        <Path d={line(travelled)} fill="none" stroke={c.accent} strokeWidth={3} strokeLinecap="round" />
        <Circle cx={mx} cy={my} r={9} fill={c.accent} opacity={0.18} />
        <Circle cx={mx} cy={my} r={4.5} fill={c.accent} stroke={c.surface} strokeWidth={2} />
      </Svg>
    </View>
  );
}
