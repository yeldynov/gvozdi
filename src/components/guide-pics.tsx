// Small still vignettes for the How-to-stand guide, one per instruction, drawn with the scene kit.
import type { ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { BoardBar, Blob, GV, HAIRS, Hand, Head, INK, Legs, Limb, Shadow, SKIN } from '@/components/scenes';

/** Sole of a right foot (big toe left), centred on 0,0, about 120×220. */
function Sole({ children }: { children?: ReactNode }) {
  return (
    <G>
      <Ellipse cx={-10} cy={76} rx={42} ry={50} fill={SKIN} />
      <Path d="M-50 76 C -54 30 -44 0 -42 -20 L 62 -30 C 56 10 36 40 32 76 Z" fill={SKIN} />
      <Ellipse cx={10} cy={-32} rx={56} ry={46} fill={SKIN} />
      {(
        [
          [-38, -86, 15],
          [-11, -95, 13],
          [13, -94, 12],
          [34, -88, 11],
          [52, -76, 10],
        ] as const
      ).map(([x, y, r]) => (
        <Circle key={x} cx={x} cy={y} r={r} fill={SKIN} />
      ))}
      {children}
    </G>
  );
}

// Pressure marks: a loose grid over the ball and the heel.
const DOTS = [
  ...[-30, -10, 10, 30, 50].flatMap((x) => [-50, -30, -10].map((y) => [x, y] as const)),
  ...[-34, -10, 14].flatMap((x) => [62, 84, 106].map((y) => [x, y] as const)),
].filter(([x, y]) => (y < 0 ? ((x - 10) / 50) ** 2 + ((y + 32) / 40) ** 2 < 1 : ((x + 10) / 36) ** 2 + ((y - 80) / 44) ** 2 < 1));

const Hem = ({ x }: { x: number }) => <Path d={`M${x} 10 h84 l4 46 q-46 14 -92 0 Z`} fill={GV.terra} />;
const Floor = ({ y }: { y: number }) => <Line x1={30} y1={y} x2={290} y2={y} stroke={GV.taupeL} strokeWidth={3} strokeLinecap="round" opacity={0.5} />;

const PICS = {
  /** Board on a mat, a level on top. */
  mat: (
    <>
      <Shadow cx={160} cy={252} rx={124} />
      <Rect x={40} y={224} width={240} height={20} rx={10} fill={GV.sage} />
      <Rect x={40} y={224} width={240} height={7} rx={3.5} fill={GV.sageL} />
      <BoardBar x={68} y={200} w={184} />
      <Rect x={104} y={128} width={112} height={26} rx={13} fill={GV.gold} />
      <Rect x={140} y={133} width={40} height={16} rx={8} fill="#F1E8D5" />
      <Circle cx={160} cy={141} r={5} fill={GV.sage} />
    </>
  ),
  /** Barefoot on the board, one hand on a table. */
  support: (
    <>
      <Rect x={214} y={150} width={92} height={12} rx={4} fill={GV.taupeD} />
      <Rect x={282} y={162} width={10} height={130} fill={GV.taupe} />
      <Shadow cx={148} cy={298} rx={76} />
      <BoardBar x={92} y={274} w={112} />
      <Legs hips={[[139, 196], [157, 196]]} feet={[[138, 272], [158, 272]]} color={GV.sage} />
      <Path d="M123 122 q25 -13 50 0 l-4 82 q-21 9 -42 0 Z" fill={GV.terra} />
      <Limb a={[127, 132]} b={[122, 188]} w={12} color={GV.terra} />
      <Hand p={[121, 192]} r={8} />
      <Limb a={[169, 132]} b={[222, 148]} w={12} color={GV.terra} />
      <Hand p={[226, 150]} r={8} />
      <Head cx={148} cy={94} hair={HAIRS.dark} />
    </>
  ),
  /** A plastered sole and a no sign: wounds stay off the board. */
  wound: (
    <>
      <G transform="translate(140 172) scale(0.95)">
        <Sole>
          <G transform="rotate(-28 6 -30)">
            <Rect x={-34} y={-46} width={80} height={32} rx={14} fill="#F1E8D5" />
            <Rect x={-6} y={-42} width={24} height={24} rx={5} fill={GV.terraL} />
          </G>
        </Sole>
      </G>
      <Circle cx={252} cy={78} r={30} fill="none" stroke={GV.terra} strokeWidth={8} />
      <Line x1={231} y1={99} x2={273} y2={57} stroke={GV.terra} strokeWidth={8} strokeLinecap="round" />
    </>
  ),
  /** One foot on the board, the other still on the floor. */
  stepOn: (
    <>
      <Floor y={276} />
      <BoardBar x={150} y={240} w={130} />
      <Hem x={90} />
      <Limb a={[108, 56]} b={[104, 266]} w={24} color={GV.sage} />
      <Ellipse cx={100} cy={270} rx={16} ry={8} fill={SKIN} />
      <Limb a={[160, 56]} b={[206, 150]} w={24} color={GV.sage} />
      <Limb a={[206, 150]} b={[214, 228]} w={22} color={GV.sage} />
      <Ellipse cx={220} cy={234} rx={16} ry={8} fill={SKIN} />
      <Path d="M126 196 q34 -52 66 -40" fill="none" stroke={GV.gold} strokeWidth={5} strokeLinecap="round" strokeDasharray="2 12" />
      <Path d="M182 146 l12 10 l-14 6" fill="none" stroke={GV.gold} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  /** Side view: the knee softly bent, not locked. */
  knees: (
    <>
      <Shadow cx={170} cy={304} rx={80} />
      <BoardBar x={98} y={276} w={150} />
      <Hem x={108} />
      <Limb a={[150, 56]} b={[184, 164]} w={26} color={GV.sage} />
      <Limb a={[184, 164]} b={[162, 262]} w={24} color={GV.sage} />
      <Ellipse cx={180} cy={268} rx={34} ry={10} fill={SKIN} />
      <Path d="M212 136 a34 34 0 0 1 0 56" fill="none" stroke={GV.gold} strokeWidth={6} strokeLinecap="round" />
    </>
  ),
  /** Eyes open on one point, breathing out. */
  gaze: (
    <>
      <G transform="translate(96 150) scale(2)">
        <Head cx={0} cy={0} hair={HAIRS.taupe} open />
      </G>
      <Line x1={150} y1={154} x2={232} y2={154} stroke={GV.gold} strokeWidth={5} strokeLinecap="round" strokeDasharray="2 14" />
      <Circle cx={262} cy={154} r={24} fill="none" stroke={GV.terra} strokeWidth={5} />
      <Circle cx={262} cy={154} r={9} fill={GV.terra} />
      <G fill="none" strokeLinecap="round" stroke={GV.sageL}>
        <Path d="M126 214 q16 10 32 0" strokeWidth={5} opacity={0.8} />
        <Path d="M130 238 q24 14 48 0" strokeWidth={4} opacity={0.5} />
      </G>
    </>
  ),
  /** The sensation curve: a sharp peak that settles into warmth. */
  wave: (
    <>
      <Floor y={252} />
      <Path d="M40 244 C 70 244 80 72 110 72 C 150 72 160 200 200 210 C 240 220 260 214 280 214 L 280 252 L 40 252 Z" fill={GV.gold} opacity={0.28} />
      <Path d="M40 244 C 70 244 80 72 110 72 C 150 72 160 200 200 210 C 240 220 260 214 280 214" fill="none" stroke={GV.terra} strokeWidth={8} strokeLinecap="round" />
      <Circle cx={110} cy={72} r={12} fill={GV.terraD} />
      <G fill="none" stroke={GV.terraL} strokeWidth={4} strokeLinecap="round" opacity={0.8}>
        <Path d="M232 186 q8 -12 0 -24 q-8 -12 0 -24" />
        <Path d="M262 182 q8 -12 0 -24 q-8 -12 0 -24" />
      </G>
    </>
  ),
  /** A timer ring filling up: start short, build up. */
  timer: (
    <>
      <Circle cx={160} cy={160} r={96} fill="none" stroke={GV.taupeL} strokeWidth={20} opacity={0.35} />
      <Circle
        cx={160}
        cy={160}
        r={96}
        fill="none"
        stroke={GV.sage}
        strokeWidth={20}
        strokeLinecap="round"
        strokeDasharray="420 603"
        transform="rotate(-90 160 160)"
      />
      <Circle cx={160} cy={160} r={12} fill={INK} />
      <Line x1={160} y1={160} x2={208} y2={130} stroke={INK} strokeWidth={6} strokeLinecap="round" />
    </>
  ),
  /** Feet back on the floor, warmth rising. */
  warm: (
    <>
      <Floor y={296} />
      <G transform="translate(116 210) scale(0.62) scale(-1 1)">
        <Sole />
      </G>
      <G transform="translate(206 210) scale(0.62)">
        <Sole />
      </G>
      <G fill="none" stroke={GV.terraL} strokeWidth={5} strokeLinecap="round" opacity={0.85}>
        {[110, 160, 210].map((x) => (
          <Path key={x} d={`M${x} 120 q12 -16 0 -32 q-12 -16 0 -32`} />
        ))}
      </G>
    </>
  ),
  /** Red pressure dots on the sole: normal, gone within the hour. */
  dots: (
    <G transform="translate(160 168) scale(1.05)">
      <Sole>
        {DOTS.map(([x, y]) => (
          <Circle key={`${x},${y}`} cx={x} cy={y} r={4.5} fill={GV.terra} opacity={0.6} />
        ))}
      </Sole>
    </G>
  ),
};
export type GuidePicName = keyof typeof PICS;

export function GuidePic({ name, size = 88 }: { name: GuidePicName; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 320 320" accessible={false}>
      <Blob cx={160} cy={160} rx={156} ry={156} fill={GV.sageL} opacity={0.14} />
      {PICS[name]}
    </Svg>
  );
}
