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
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Defs, Line, Path, RadialGradient, Stop } from 'react-native-svg';

import { Txt } from '@/components/ui';
import { ART } from '@/lib/art-palette';
import { formatDuration } from '@/lib/practice';
import { MILD_SEC, PEAK_SEC, peakIntensity } from '@/lib/session';
import { fonts, space, useColors, useSkin } from '@/theme';

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

// The peak line: x is piecewise time, so the short sharp stretch gets room. Its height is the felt intensity, so it
// climbs without a dip to 1:30, slopes down to 7:00 and lies flat; fine teeth on the edge are the sting, not the trend.
const LW = 320;
const LH = 64;
const BASE = LH - 11; // room for the dot halo on the flat line
const AMP = BASE - 10;
const SEGS = [
  { key: 'sharp', from: 0, to: PEAK_SEC, x0: 0, x1: 112, art: 'terra' },
  { key: 'stings', from: PEAK_SEC, to: MILD_SEC, x0: 112, x1: 240, art: 'gold' },
  { key: 'easier', from: MILD_SEC, to: MILD_SEC + 180, x0: 240, x1: LW, art: 'sage' },
] as const;
const lineX = (sec: number) => {
  const s = SEGS.find((g) => sec < g.to) ?? SEGS[2];
  return s.x0 + (s.x1 - s.x0) * Math.min(1, Math.max(0, (sec - s.from) / (s.to - s.from)));
};
const ridgeY = (sec: number) => BASE - peakIntensity(sec) * AMP;
const SEG_PATHS = SEGS.map((g) => {
  if (g.key === 'easier') return { edge: `M${g.x0} ${BASE}H${g.x1}`, area: '' };
  const pts: string[] = [];
  for (let x = g.x0, i = 0; x <= g.x1; x += 3, i++) {
    const sec = g.from + ((x - g.x0) / (g.x1 - g.x0)) * (g.to - g.from);
    const tooth = (i % 2 ? -1 : 1) * 2.5 * peakIntensity(sec); // the sting: fine, never deeper than the climb
    pts.push(`${x} ${(ridgeY(sec) + tooth).toFixed(1)}`);
  }
  const edge = `M${pts.join('L')}`;
  return { edge, area: `${edge}L${g.x1} ${BASE}L${g.x0} ${BASE}Z` };
});

/** A segment of the ridge; the one you are in throbs from its base, faster and higher while it is sharp. */
function LineSeg({ d, color, opacity, tremble, running }: { d: { edge: string; area: string }; color: string; opacity: number; tremble: number; running: boolean }) {
  const reduced = useReducedMotion();
  const v = useSharedValue(0);
  useEffect(() => {
    if (!tremble || !running || reduced) {
      cancelAnimation(v);
      v.value = 0;
      return;
    }
    v.value = withRepeat(withTiming(1, { duration: 90 + 110 * (4 - tremble), easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(v);
  }, [tremble, running, reduced, v]);
  const style = useAnimatedStyle(() => ({ transformOrigin: 'bottom', transform: [{ scaleY: 1 + 0.035 * tremble * v.value }] }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${LW} ${LH}`}>
        {d.area ? <Path d={d.area} fill={color} opacity={opacity * 0.18} /> : null}
        <Path d={d.edge} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" opacity={opacity} />
      </Svg>
    </Animated.View>
  );
}

/**
 * Peak guidance as a ridge that flattens: a steady climb to the top at 1:30, a long slope down to 7:00, then flat calm.
 * A dot rides it; passed stretches dim, the current one trembles, calm ahead is always in view.
 */
export function PeakLine({ elapsed, running }: { elapsed: number; running: boolean }) {
  const c = useColors();
  const { GV } = ART[useSkin()];
  const { t } = useTranslation();
  const x = lineX(elapsed);
  const y = elapsed < MILD_SEC ? ridgeY(elapsed) : BASE;
  const at = SEGS.findIndex((g) => elapsed < g.to);
  const cur = at < 0 ? 2 : at;
  // Calm uses the theme's success colour so it stays readable ahead in every skin and mode.
  const segColor = (i: number) => (i === 2 ? c.success : GV[SEGS[i].art]);
  const tremble = cur === 2 ? 0 : Math.max(1, Math.round(peakIntensity(elapsed) * 4)); // 4 levels, so the loop restarts rarely
  return (
    <View style={{ alignSelf: 'stretch', gap: space[2] }}>
      <View style={{ width: '100%', aspectRatio: LW / LH }}>
        {SEGS.map((g, i) => (
          <LineSeg key={g.key} d={SEG_PATHS[i]} color={segColor(i)} opacity={i < cur ? 0.3 : i === cur ? 1 : 0.55} tremble={i === cur ? tremble : 0} running={running} />
        ))}
        <Svg width="100%" height="100%" viewBox={`0 0 ${LW} ${LH}`} style={StyleSheet.absoluteFill}>
          <Circle cx={x} cy={y} r={10} fill={segColor(cur)} opacity={0.2} />
          <Circle cx={x} cy={y} r={5} fill={segColor(cur)} stroke={c.bg} strokeWidth={2} />
        </Svg>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {SEGS.map((g, i) => (
          <View key={g.key} style={{ flex: g.x1 - g.x0, gap: 2 }}>
            <Txt variant="body" style={{ color: i === cur ? c.text : c.text3, fontFamily: i === cur ? fonts.textBold : fonts.text }}>
              {t(`session.stages.${g.key}`)}
            </Txt>
            <Txt variant="caption" style={{ color: c.text3 }}>
              {i === 2 ? `${formatDuration(g.from)}+` : `${formatDuration(g.from)}–${formatDuration(g.to)}`}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}
