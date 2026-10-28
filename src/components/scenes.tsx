// Character scenes from the gvozdi-pwa design set (designs/.../scenes.jsx), ported so their parts can move.
// Each scene is a stack of 320×320 SVG layers; moving parts sit on their own Animated.View layer.
import { useEffect, type ComponentProps, type ReactNode } from 'react';
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
import Svg, { Circle, Ellipse, G, Line, Path } from 'react-native-svg';

const GV = {
  sage: '#2D5A4E', sageD: '#214339', sageL: '#3C6B5C',
  terra: '#D97B4F', terraD: '#C2663B', terraL: '#E89A72',
  taupe: '#8B7355', taupeL: '#A68B68', taupeD: '#6E5A41',
  gold: '#F4A261',
};
const SKIN = '#EAC59C';
const INK = '#33302B';
const HAIRS = { sage: '#33473F', taupe: '#5A4634', dark: '#3A332B' };

type Pt = [number, number];

// ── kit ────────────────────────────────────────────────────────────────
function Blob({ cx, cy, rx, ry, fill, opacity }: { cx: number; cy: number; rx: number; ry: number; fill: string; opacity: number }) {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} opacity={opacity} />;
}
function FallLeaf({ x, y, rot = 0, color, s = 1 }: { x: number; y: number; rot?: number; color: string; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <Path d="M0 0 C 9 -5 17 -2 19 6 C 11 9 2 7 0 0 Z" fill={color} />
      <Path d="M2 1 C 8 2 14 4 18 6" stroke="rgba(0,0,0,.18)" strokeWidth={1} fill="none" />
    </G>
  );
}
function Shadow({ cx, cy, rx = 60, ry = 9 }: { cx: number; cy: number; rx?: number; ry?: number }) {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={GV.taupeD} opacity={0.14} />;
}
/** Head with long hair, closed eyes and blush. */
function Head({ cx, cy, r = 21, hair, tilt = 0 }: { cx: number; cy: number; r?: number; hair: string; tilt?: number }) {
  return (
    <G transform={`rotate(${tilt} ${cx} ${cy})`}>
      <Path
        d={`M${cx - r - 3} ${cy - 6} C ${cx - r - 12} ${cy + 30}, ${cx - r - 2} ${cy + 50}, ${cx - r + 9} ${cy + 47} L ${cx + r - 9} ${cy + 47} C ${cx + r + 2} ${cy + 50}, ${cx + r + 12} ${cy + 30}, ${cx + r + 3} ${cy - 6} Z`}
        fill={hair}
      />
      <Circle cx={cx} cy={cy} r={r} fill={SKIN} />
      <Path
        d={`M${cx - r} ${cy - 2} C ${cx - r + 1} ${cy - r - 4}, ${cx + r - 1} ${cy - r - 4}, ${cx + r} ${cy - 2} C ${cx + r - 5} ${cy - r + 5}, ${cx + 4} ${cy - r + 7}, ${cx + 2} ${cy - r + 5} C ${cx - 2} ${cy - r + 9}, ${cx - r + 6} ${cy - r + 5}, ${cx - r} ${cy - 2} Z`}
        fill={hair}
      />
      <Path d={`M${cx - 9} ${cy + 1} q 3.4 4 7 0`} stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d={`M${cx + 2} ${cy + 1} q 3.4 4 7 0`} stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
      <Circle cx={cx - 12} cy={cy + 8} r={3.4} fill={GV.terra} opacity={0.32} />
      <Circle cx={cx + 12} cy={cy + 8} r={3.4} fill={GV.terra} opacity={0.32} />
    </G>
  );
}
function Limb({ a, b, w = 15, color }: { a: Pt; b: Pt; w?: number; color: string }) {
  return <Line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={w} strokeLinecap="round" />;
}

// ── motion ─────────────────────────────────────────────────────────────
/** Endless cycle: eased 0→1→0 by default, or linear 0→1 then jump back with `restart`. Stays 0 on reduced motion. */
function useLoop(ms: number, { restart = false, delay = 0 } = {}) {
  const reduced = useReducedMotion();
  const v = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    const anim = withRepeat(withTiming(1, { duration: ms, easing: restart ? Easing.linear : Easing.inOut(Easing.sin) }), -1, !restart);
    v.value = delay ? withDelay(delay, anim) : anim;
    return () => cancelAnimation(v);
  }, [reduced, v, ms, restart, delay]);
  return { v, reduced };
}

/** One full-scene SVG layer; `style` moves it. */
function Layer({ size, style, children }: { size: number; style?: ComponentProps<typeof Animated.View>['style']; children: ReactNode }) {
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width={size} height={size} viewBox="0 0 320 320">
        {children}
      </Svg>
    </Animated.View>
  );
}

/** Pivot for transforms, from 320-space coordinates. */
const origin = (x: number, y: number) => ({ transformOrigin: `${x / 3.2}% ${y / 3.2}%` });

/** A leaf that drifts down and flutters, fading in and out; still in place on reduced motion. */
function DriftLeaf({ size, ms, delay, ...leaf }: { size: number; ms: number; delay: number; x: number; y: number; rot?: number; color: string; s?: number }) {
  const { v, reduced } = useLoop(ms, { restart: true, delay });
  const k = size / 320;
  const style = useAnimatedStyle(() => {
    if (reduced) return {};
    const t = v.value;
    const wave = Math.sin(t * Math.PI * 2);
    return {
      opacity: interpolate(t, [0, 0.15, 0.75, 1], [0, 1, 1, 0]),
      transform: [{ translateY: (t * 30 - 8) * k }, { translateX: wave * 7 * k }, { rotate: `${wave * 14}deg` }],
    };
  });
  return (
    <Layer size={size} style={[origin(leaf.x, leaf.y), style]}>
      <FallLeaf {...leaf} />
    </Layer>
  );
}

// ── scenes ─────────────────────────────────────────────────────────────
/** Seated, hands at heart; breath arcs widen and the body rises on a 4 s inhale / 4 s exhale. */
function SceneBreathe({ size }: { size: number }) {
  const { v, reduced } = useLoop(4000);
  const k = size / 320;
  const arcs = useAnimatedStyle(() =>
    reduced
      ? {}
      : { opacity: interpolate(v.value, [0, 1], [0.55, 1]), transform: [{ scale: interpolate(v.value, [0, 1], [0.9, 1.08]) }] },
  );
  const body = useAnimatedStyle(() => ({ transform: [{ translateY: -5 * k * v.value }] }));
  const top = GV.terra;
  return (
    <>
      <Layer size={size}>
        <Blob cx={160} cy={150} rx={116} ry={108} fill={GV.sageL} opacity={0.15} />
      </Layer>
      <Layer size={size} style={[origin(160, 150), arcs]}>
        <G fill="none" strokeLinecap="round">
          <Path d="M120 150 a40 40 0 0 1 80 0" stroke={GV.terra} strokeWidth={4} opacity={0.5} />
          <Path d="M104 150 a56 56 0 0 1 112 0" stroke={GV.gold} strokeWidth={3.5} opacity={0.4} />
          <Path d="M88 150 a72 72 0 0 1 144 0" stroke={GV.terraL} strokeWidth={3} opacity={0.28} />
        </G>
      </Layer>
      <DriftLeaf size={size} ms={9000} delay={0} x={70} y={96} rot={20} color={GV.gold} />
      <DriftLeaf size={size} ms={10000} delay={3500} x={238} y={120} rot={-30} color={GV.terra} s={0.85} />
      <Layer size={size}>
        <Shadow cx={160} cy={286} rx={94} ry={11} />
        <Path d="M86 276 C 86 244 122 232 160 232 C 198 232 234 244 234 276 C 200 290 120 290 86 276 Z" fill={GV.sage} />
        <Path d="M120 250 q40 -16 80 0" stroke={GV.sageD} strokeWidth={3} fill="none" opacity={0.4} strokeLinecap="round" />
        <Ellipse cx={150} cy={246} rx={10} ry={6} fill={SKIN} />
        <Ellipse cx={170} cy={246} rx={10} ry={6} fill={SKIN} />
      </Layer>
      <Layer size={size} style={body}>
        <Path d="M134 150 q26 -14 52 0 l-6 86 q-20 7 -40 0 Z" fill={top} />
        <Path d="M178 152 l-5 84 q-9 3 -15 2 l4 -86 Z" fill={GV.terraD} opacity={0.5} />
        <Limb a={[140, 160]} b={[158, 196]} w={12} color={top} />
        <Limb a={[180, 160]} b={[162, 196]} w={12} color={top} />
        <Path d="M152 196 q8 -10 16 0 q-8 8 -16 0 Z" fill={SKIN} />
        <Head cx={160} cy={120} hair={HAIRS.dark} />
      </Layer>
    </>
  );
}

export const SCENES = { breathe: SceneBreathe };
export type SceneName = keyof typeof SCENES;

/** Animated scene at `size`×`size`. */
export function Scene({ name, size }: { name: SceneName; size: number }) {
  const Comp = SCENES[name];
  return (
    <View style={{ width: size, height: size }}>
      <Comp size={size} />
    </View>
  );
}
