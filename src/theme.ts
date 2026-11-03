import { useColorScheme } from 'react-native';

import type { Skin } from '@/lib/types';
import { useStore } from '@/store';

// Earthy palette from gvozdi-pwa (src/globals.css .palette-earthy); dark is its warm night counterpart.
const light = {
  isDark: false,
  bg: '#f5efe6',
  bg2: '#ede4d5',
  bg3: '#e3d7c3',
  surface: '#fbf6ee',
  text: '#2d2419',
  text2: '#7a6b54',
  text3: '#918166',
  divider: 'rgba(45, 36, 25, 0.1)',
  primary: '#5a4a36',
  onPrimary: '#fbf6ee',
  accent: '#d98c3c',
  success: '#6f8f6a',
  error: '#b04a30',
  info: '#3f7896',
  illus: '#c2a577',
};

const dark: typeof light = {
  isDark: true,
  bg: '#1b1611',
  bg2: '#241d16',
  bg3: '#2f261d',
  surface: '#2a2219',
  text: '#f2e9dc',
  text2: '#b8a68b',
  text3: '#8a7a62',
  divider: 'rgba(242, 233, 220, 0.1)',
  primary: '#e3c9a0',
  onPrimary: '#1b1611',
  accent: '#e39a4f',
  success: '#8fb08a',
  error: '#d9694c',
  info: '#7fb2d0',
  illus: '#8a6f4a',
};

// Herbarium skin: cool white mount sheets on a sage ground, specimen green for growth and the main action, ochre for soil and earned marks.
// Dark is the same sheet at night: green-black mount, pale leaf ink.
const herbLight: typeof light = {
  isDark: false,
  bg: '#e9ece5',
  bg2: '#dfe3da',
  bg3: '#d3d8cc',
  surface: '#f4f5f0',
  text: '#22261f',
  text2: '#5a6154',
  text3: '#6f7669',
  divider: 'rgba(34, 38, 31, 0.12)',
  primary: '#3f6a3a',
  onPrimary: '#ffffff',
  accent: '#9a7020',
  success: '#4f7f45',
  error: '#a8442e',
  info: '#3f6e8c',
  illus: '#b8892b',
};

const herbDark: typeof light = {
  isDark: true,
  bg: '#111711',
  bg2: '#1c251c',
  bg3: '#263226',
  surface: '#19211a',
  text: '#e4ede0',
  text2: '#a3b39e',
  text3: '#859480',
  divider: 'rgba(228, 237, 224, 0.1)',
  primary: '#9ccb8f',
  onPrimary: '#10180f',
  accent: '#d9ae52',
  success: '#8dbf80',
  error: '#e07a62',
  info: '#86b6d3',
  illus: '#a8822f',
};

// Ink skin: sumi ink on washi paper, one vermilion seal for the hard minutes and the marks you earn.
// Dark is the inkstone: near-black slab, paper-white strokes.
const inkLight: typeof light = {
  isDark: false,
  bg: '#f2efe7',
  bg2: '#e9e5da',
  bg3: '#ddd7c9',
  surface: '#f8f6f1',
  text: '#1c1b19',
  text2: '#57534b',
  text3: '#6e695f',
  divider: 'rgba(28, 27, 25, 0.18)',
  primary: '#1c1b19',
  onPrimary: '#f8f6f1',
  accent: '#b3352a',
  success: '#4a6b58',
  error: '#8c2b20',
  info: '#3a5872',
  illus: '#a39a88',
};

const inkDark: typeof light = {
  isDark: true,
  bg: '#131311',
  bg2: '#1f1e1b',
  bg3: '#2a2925',
  surface: '#1b1a18',
  text: '#ebe6dc',
  text2: '#aaa497',
  text3: '#8a857a',
  divider: 'rgba(235, 230, 220, 0.16)',
  primary: '#ebe6dc',
  onPrimary: '#131311',
  accent: '#e8634f',
  success: '#8fb09a',
  error: '#ec8f78',
  info: '#8fb0cb',
  illus: '#5e584d',
};

// Dusk skin: for the board at the edges of the day. Dawn mist in light, deep evening indigo with candlelight in dark.
const duskLight: typeof light = {
  isDark: false,
  bg: '#eceef3',
  bg2: '#e1e4ed',
  bg3: '#d4d8e5',
  surface: '#f6f7fa',
  text: '#1f2233',
  text2: '#525770',
  text3: '#666b84',
  divider: 'rgba(31, 34, 51, 0.1)',
  primary: '#363b5e',
  onPrimary: '#f6f7fa',
  accent: '#a65c22',
  success: '#457262',
  error: '#a8433a',
  info: '#486ea3',
  illus: '#aab1c9',
};

const duskDark: typeof light = {
  isDark: true,
  bg: '#131524',
  bg2: '#1d2035',
  bg3: '#282c45',
  surface: '#1b1e31',
  text: '#e9e7f1',
  text2: '#aaacc5',
  text3: '#8a8da7',
  divider: 'rgba(233, 231, 241, 0.1)',
  primary: '#f0c58a',
  onPrimary: '#131524',
  accent: '#f0a35e',
  success: '#8cc0a8',
  error: '#ec8a78',
  info: '#98b6e8',
  illus: '#3d4263',
};

export type Colors = typeof light;

const PALETTES: Record<Skin, [Colors, Colors]> = {
  earthy: [light, dark],
  herbarium: [herbLight, herbDark],
  ink: [inkLight, inkDark],
  dusk: [duskLight, duskDark],
};

export const radius = { xs: 8, sm: 12, md: 18, lg: 24, xl: 32, pill: 999 };
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40 };

export const fonts = {
  display: 'Fraunces_300Light',
  // Fraunces has no Cyrillic; UK/RU headlines use Literata.
  displayCyrillic: 'Literata_300Light',
  text: 'InterTight_400Regular',
  textMedium: 'InterTight_500Medium',
  textBold: 'InterTight_600SemiBold',
};

// Herbarium: Golos Text everywhere (it has Cyrillic); Fraunces stays only in the Latin wordmark.
export const herbFonts = {
  display: 'GolosText_500Medium',
  text: 'GolosText_400Regular',
  textMedium: 'GolosText_500Medium',
  textBold: 'GolosText_600SemiBold',
};

// Ink: Literata everywhere (it has Cyrillic), a book face for a paper skin.
export const inkFonts = {
  display: 'Literata_300Light',
  text: 'Literata_400Regular',
  textMedium: 'Literata_500Medium',
  textBold: 'Literata_600SemiBold',
};

export function useSkin(): Skin {
  return useStore((s) => s.settings.skin ?? 'earthy');
}

export function useColors(): Colors {
  const system = useColorScheme();
  const pref = useStore((s) => s.settings.theme);
  const skin = useSkin();
  const mode = pref === 'system' ? system : pref;
  return palette(skin, mode === 'dark');
}

/** A skin's colors regardless of the active one (the skin picker previews them all). */
export function palette(skin: Skin, isDark: boolean): Colors {
  return (PALETTES[skin] ?? PALETTES.earthy)[isDark ? 1 : 0];
}
