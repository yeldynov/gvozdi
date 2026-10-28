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
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

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
/** Sadhu board in profile, nails underneath. */
function BoardBar({ x, y, w }: { x: number; y: number; w: number }) {
  const n = Math.max(5, Math.round(w / 13));
  return (
    <G>
      <Rect x={x} y={y} width={w} height={13} rx={6} fill={GV.taupe} />
      <Rect x={x} y={y} width={w} height={6} rx={3} fill={GV.taupeL} />
      <G stroke={INK} strokeWidth={2.4} strokeLinecap="round">
        {Array.from({ length: n }, (_, i) => {
          const nx = x + 10 + i * ((w - 20) / (n - 1));
          return <Line key={i} x1={nx} y1={y + 13} x2={nx} y2={y + 22} />;
        })}
      </G>
    </G>
  );
}
function Hand({ p, r = 7 }: { p: Pt; r?: number }) {
  return <Circle cx={p[0]} cy={p[1]} r={r} fill={SKIN} />;
}
/** Standing legs and bare feet on the board. */
function Legs({ hips, feet, color }: { hips: [Pt, Pt]; feet: [Pt, Pt]; color: string }) {
  return (
    <>
      <Limb a={hips[0]} b={feet[0]} w={17} color={color} />
      <Limb a={hips[1]} b={feet[1]} w={17} color={color} />
      <Ellipse cx={feet[0][0] - 2} cy={feet[0][1] + 2} rx={11} ry={6} fill={SKIN} />
      <Ellipse cx={feet[1][0] + 2} cy={feet[1][1] + 2} rx={11} ry={6} fill={SKIN} />
    </>
  );
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
      transform: [{ translateY: (t * 56 - 12) * k }, { translateX: wave * 14 * k }, { rotate: `${wave * 30}deg` }],
    };
  });
  return (
    <Layer size={size} style={[origin(leaf.x, leaf.y), style]}>
      <FallLeaf {...leaf} />
    </Layer>
  );
}

/** One-shot burst of leaves flying out from the centre and fading; nothing on reduced motion. */
export function LeafBurst({ size, delay = 0 }: { size: number; delay?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  const colors = [GV.sage, GV.gold, GV.terra, GV.sageL];
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <BurstLeaf key={i} size={size} angle={(i / 8) * Math.PI * 2 - Math.PI / 2} color={colors[i % 4]} delay={delay + i * 40} />
      ))}
    </>
  );
}

function BurstLeaf({ size, angle, color, delay }: { size: number; angle: number; color: string; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }));
  }, [t, delay]);
  const r = size * 0.5;
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.1, 0.6, 1], [0, 1, 1, 0]),
    transform: [
      { translateX: Math.cos(angle) * r * t.value },
      { translateY: Math.sin(angle) * r * t.value + size * 0.08 * t.value * t.value },
      { rotate: `${t.value * 220}deg` },
    ],
  }));
  return (
    <Layer size={size} style={[origin(160, 140), style]}>
      <FallLeaf x={150} y={136} color={color} s={1.3} />
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
      : { opacity: interpolate(v.value, [0, 1], [0.3, 1]), transform: [{ scale: interpolate(v.value, [0, 1], [0.82, 1.16]) }] },
  );
  const body = useAnimatedStyle(() => ({ transform: [{ translateY: -10 * k * v.value }] }));
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

/** Stepping onto the board, arms out: the arms teeter for balance and the sun swells. */
function SceneStep({ size }: { size: number }) {
  const { v: tilt, reduced } = useLoop(3200);
  const { v: glow } = useLoop(5000);
  const arms = useAnimatedStyle(() => (reduced ? {} : { transform: [{ rotate: `${interpolate(tilt.value, [0, 1], [-9, 9])}deg` }] }));
  const sun = useAnimatedStyle(() => (reduced ? {} : { transform: [{ scale: 1 + 0.22 * glow.value }] }));
  const top = GV.terra;
  const leg = GV.sage;
  return (
    <>
      <Layer size={size}>
        <Blob cx={170} cy={150} rx={120} ry={120} fill={GV.sageL} opacity={0.16} />
      </Layer>
      <Layer size={size} style={[origin(250, 78), sun]}>
        <Circle cx={250} cy={78} r={26} fill={GV.gold} />
      </Layer>
      <DriftLeaf size={size} ms={9000} delay={0} x={70} y={70} rot={20} color={GV.terra} />
      <DriftLeaf size={size} ms={10000} delay={3000} x={248} y={140} rot={-40} color={GV.gold} />
      <DriftLeaf size={size} ms={8500} delay={6000} x={120} y={250} rot={70} color={GV.sage} s={0.8} />
      <Layer size={size}>
        <Shadow cx={170} cy={296} rx={88} />
        <BoardBar x={150} y={272} w={120} />
        <Limb a={[148, 200]} b={[140, 270]} w={17} color={leg} />
        <Limb a={[160, 200]} b={[196, 246]} w={17} color={leg} />
        <Limb a={[196, 246]} b={[214, 270]} w={16} color={leg} />
        <Ellipse cx={138} cy={272} rx={11} ry={6} fill={SKIN} />
        <Ellipse cx={218} cy={271} rx={11} ry={6} fill={SKIN} />
        <Path d="M132 124 q22 -12 44 0 l-3 80 q-19 8 -38 0 Z" fill={top} />
        <Path d="M168 126 l5 78 q-9 4 -16 3 l3 -82 Z" fill={GV.terraD} opacity={0.5} />
      </Layer>
      <Layer size={size} style={[origin(158, 134), arms]}>
        <Limb a={[140, 134]} b={[96, 120]} w={13} color={top} />
        <Limb a={[176, 134]} b={[222, 150]} w={13} color={top} />
        <Hand p={[92, 118]} />
        <Hand p={[226, 152]} />
      </Layer>
      <Layer size={size}>
        <Head cx={154} cy={96} hair={HAIRS.sage} tilt={-4} />
      </Layer>
    </>
  );
}

/** Composed under a sharp moment: focus marks pulse outward like waves of sensation. */
function SceneFeel({ size }: { size: number }) {
  const { v, reduced } = useLoop(1800);
  const k = size / 320;
  const wave = (dir: number) =>
    reduced ? {} : { opacity: interpolate(v.value, [0, 1], [0.15, 1]), transform: [{ translateX: dir * 14 * k * v.value }, { scale: 1 + 0.06 * v.value }] };
  const left = useAnimatedStyle(() => wave(-1));
  const right = useAnimatedStyle(() => wave(1));
  const top = GV.terra;
  return (
    <>
      <Layer size={size}>
        <Blob cx={160} cy={150} rx={112} ry={116} fill={GV.terra} opacity={0.12} />
      </Layer>
      {(
        [
          [left, [[86, 120, 74, 112], [84, 160, 70, 160]]],
          [right, [[234, 120, 246, 112], [236, 160, 250, 160]]],
        ] as const
      ).map(([style, lines], i) => (
        <Layer key={i} size={size} style={style}>
          <G stroke={GV.terra} strokeWidth={3} strokeLinecap="round" opacity={0.55}>
            {lines.map(([x1, y1, x2, y2]) => (
              <Line key={y1} x1={x1} y1={y1} x2={x2} y2={y2} />
            ))}
          </G>
        </Layer>
      ))}
      <DriftLeaf size={size} ms={9000} delay={0} x={70} y={210} rot={50} color={GV.gold} s={0.85} />
      <DriftLeaf size={size} ms={10000} delay={4000} x={236} y={210} rot={-50} color={GV.sage} s={0.85} />
      <Layer size={size}>
        <Shadow cx={160} cy={298} rx={70} />
        <BoardBar x={104} y={274} w={112} />
        <Legs hips={[[151, 196], [169, 196]]} feet={[[150, 272], [170, 272]]} color={GV.sage} />
        <Path d="M135 122 q25 -13 50 0 l-4 82 q-21 9 -42 0 Z" fill={top} />
        <Path d="M177 124 l4 80 q-9 4 -16 3 l3 -84 Z" fill={GV.terraD} opacity={0.5} />
        <Limb a={[139, 132]} b={[134, 188]} w={12} color={top} />
        <Limb a={[181, 132]} b={[186, 188]} w={12} color={top} />
        <Hand p={[133, 192]} r={8} />
        <Hand p={[187, 192]} r={8} />
        <Head cx={160} cy={94} hair={HAIRS.taupe} />
      </Layer>
    </>
  );
}

/** Glancing at the phone timer: its hand turns slowly while the head drifts. */
function SceneTime({ size }: { size: number }) {
  const { v: turn, reduced } = useLoop(6000, { restart: true });
  const { v: drift } = useLoop(4200);
  // Timer centre (143, 184) after the phone's rotate(-8 142 178).
  const hand = useAnimatedStyle(() => (reduced ? {} : { transform: [{ rotate: `${turn.value * 360}deg` }] }));
  const head = useAnimatedStyle(() => (reduced ? {} : { transform: [{ rotate: `${interpolate(drift.value, [0, 1], [-5, 5])}deg` }] }));
  const top = GV.sage;
  return (
    <>
      <Layer size={size}>
        <Blob cx={150} cy={150} rx={118} ry={112} fill={GV.gold} opacity={0.15} />
      </Layer>
      <DriftLeaf size={size} ms={9000} delay={0} x={70} y={92} rot={24} color={GV.sage} />
      <DriftLeaf size={size} ms={10000} delay={4500} x={244} y={150} rot={-40} color={GV.terra} s={0.85} />
      <Layer size={size}>
        <Shadow cx={158} cy={298} rx={78} />
        <BoardBar x={104} y={276} w={116} />
        <Legs hips={[[150, 198], [168, 198]]} feet={[[150, 274], [170, 274]]} color={GV.taupe} />
        <Path d="M134 124 q26 -13 50 0 l-4 82 q-21 9 -42 0 Z" fill={top} />
        <Path d="M176 126 l4 80 q-9 4 -16 3 l3 -84 Z" fill={GV.sageD} opacity={0.45} />
        <Limb a={[138, 134]} b={[128, 196]} w={12} color={top} />
        <Hand p={[127, 200]} />
        <Limb a={[180, 134]} b={[176, 168]} w={12} color={top} />
        <Limb a={[176, 168]} b={[150, 176]} w={11} color={SKIN} />
        <G transform="rotate(-8 142 178)">
          <Rect x={126} y={160} width={34} height={48} rx={7} fill="#1A1A1A" />
          <Rect x={130} y={166} width={26} height={36} rx={4} fill="#F1E8D5" />
          <Circle cx={143} cy={184} r={9} fill="none" stroke={GV.terra} strokeWidth={3} />
        </G>
      </Layer>
      <Layer size={size} style={[origin(143.8, 183.8), hand]}>
        <G transform="rotate(-8 142 178)">
          <Path d="M143 184 L143 177" stroke={GV.sage} strokeWidth={2} strokeLinecap="round" />
        </G>
      </Layer>
      <Layer size={size} style={[origin(158, 117), head]}>
        <Head cx={158} cy={96} hair={HAIRS.sage} tilt={6} />
      </Layer>
    </>
  );
}

/** One arm raised in quiet triumph: the flame flickers and the arm sways. */
function SceneStreak({ size }: { size: number }) {
  const { v: flick, reduced } = useLoop(1100);
  const { v: sway } = useLoop(3000);
  const flame = useAnimatedStyle(() =>
    reduced ? {} : { transform: [{ scaleY: interpolate(flick.value, [0, 1], [0.8, 1.2]) }, { scaleX: interpolate(flick.value, [0, 1], [1.08, 0.92]) }] },
  );
  const arm = useAnimatedStyle(() => (reduced ? {} : { transform: [{ rotate: `${interpolate(sway.value, [0, 1], [-12, 12])}deg` }] }));
  const top = GV.sage;
  return (
    <>
      <Layer size={size}>
        <Blob cx={150} cy={150} rx={116} ry={116} fill={GV.gold} opacity={0.17} />
      </Layer>
      <Layer size={size} style={[origin(238, 117), flame]}>
        <G transform="translate(238 86) scale(0.42)">
          <Path
            d="M0 -52 C 26 -10 40 14 33 44 C 27 64 16 74 0 74 C -16 74 -27 64 -33 44 C -39 24 -20 10 -16 -14 C -10 2 -4 -6 0 -52 Z"
            fill={GV.terra}
          />
          <Path d="M0 -20 C 14 6 20 24 12 40 C 6 50 -6 50 -12 40 C -18 28 -6 18 -4 0 C 0 8 -2 4 0 -20 Z" fill={GV.gold} />
        </G>
      </Layer>
      <DriftLeaf size={size} ms={9000} delay={0} x={66} y={110} rot={26} color={GV.terra} />
      <DriftLeaf size={size} ms={10000} delay={4000} x={70} y={230} rot={66} color={GV.sage} s={0.85} />
      <Layer size={size}>
        <Shadow cx={156} cy={298} rx={72} />
        <BoardBar x={100} y={274} w={112} />
        <Legs hips={[[147, 196], [165, 196]]} feet={[[146, 272], [166, 272]]} color={GV.taupe} />
        <Path d="M131 122 q25 -13 50 0 l-4 82 q-21 9 -42 0 Z" fill={top} />
        <Path d="M173 124 l4 80 q-9 4 -16 3 l3 -84 Z" fill={GV.sageD} opacity={0.45} />
        <Limb a={[135, 132]} b={[126, 196]} w={12} color={top} />
        <Hand p={[125, 200]} />
      </Layer>
      <Layer size={size} style={[origin(177, 130), arm]}>
        <Limb a={[177, 130]} b={[196, 86]} w={12} color={top} />
        <Hand p={[198, 80]} r={8} />
      </Layer>
      <Layer size={size}>
        <Head cx={156} cy={94} hair={HAIRS.sage} tilt={4} />
      </Layer>
    </>
  );
}

export const SCENES = { breathe: SceneBreathe, step: SceneStep, feel: SceneFeel, time: SceneTime, streak: SceneStreak };
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
