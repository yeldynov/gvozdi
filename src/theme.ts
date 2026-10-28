import { useColorScheme } from 'react-native';

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

export type Colors = typeof light;

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

export function useColors(): Colors {
  const system = useColorScheme();
  const pref = useStore((s) => s.settings.theme);
  const mode = pref === 'system' ? system : pref;
  return mode === 'dark' ? dark : light;
}
