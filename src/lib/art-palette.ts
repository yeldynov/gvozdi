// Illustration palettes per skin, under the earthy role names (sage = legs and some tops, terra = tops, taupe = board and
// cushion, gold = sun, aura and sparkles). Pure data: scenes.tsx reads it at render, scripts/recolor-art.mjs maps the
// earthy hexes of assets/art/*.svg onto it. Herbarium keeps its own scenes in src/skins/herbarium/.
export type ArtPalette = {
  GV: { sage: string; sageD: string; sageL: string; terra: string; terraD: string; terraL: string; taupe: string; taupeL: string; taupeD: string; gold: string };
  SKIN: string;
  INK: string;
  HAIRS: { sage: string; taupe: string; dark: string };
  GREY: string; // clouds
  MIST: string;
  PHONE: string;
  SCREEN: string;
  SAND: string;
};

export const ART: Record<'earthy' | 'ink' | 'dusk', ArtPalette> = {
  earthy: {
    GV: {
      sage: '#2D5A4E', sageD: '#214339', sageL: '#3C6B5C',
      terra: '#D97B4F', terraD: '#C2663B', terraL: '#E89A72',
      taupe: '#8B7355', taupeL: '#A68B68', taupeD: '#6E5A41',
      gold: '#F4A261',
    },
    SKIN: '#EAC59C',
    INK: '#33302B',
    HAIRS: { sage: '#33473F', taupe: '#5A4634', dark: '#3A332B' },
    GREY: '#8C9AA6',
    MIST: '#B9C4CC',
    PHONE: '#1A1A1A',
    SCREEN: '#F1E8D5',
    SAND: '#DBCAA8',
  },
  // Sumi ink on washi: clothes in ink greys, one vermilion (the seal) for tops and the sun, a pale vermilion wash for auras.
  ink: {
    GV: {
      sage: '#3A3936', sageD: '#232220', sageL: '#77736B',
      terra: '#B8402F', terraD: '#932F22', terraL: '#D9806E',
      taupe: '#8A8378', taupeL: '#ADA698', taupeD: '#5E5952',
      gold: '#D9806E',
    },
    SKIN: '#EED9C2',
    INK: '#1C1B19',
    HAIRS: { sage: '#2A2926', taupe: '#3D3B37', dark: '#1F1E1C' },
    GREY: '#8F8B83',
    MIST: '#C2BDB2',
    PHONE: '#1C1B19',
    SCREEN: '#F8F6F1',
    SAND: '#D6CFC2',
  },
  // Evening: twilight indigo clothes, a dusty rose top, candle-gold glow and moon, lilac-grey wood.
  dusk: {
    GV: {
      sage: '#3B4470', sageD: '#2C3358', sageL: '#6A74A6',
      terra: '#B86B7E', terraD: '#97566A', terraL: '#D493A3',
      taupe: '#7C7A8F', taupeL: '#9D9BB0', taupeD: '#5E5C70',
      gold: '#F2C27A',
    },
    SKIN: '#EAC59C',
    INK: '#1F2233',
    HAIRS: { sage: '#2C3352', taupe: '#4A3F4F', dark: '#262838' },
    GREY: '#7F88A8',
    MIST: '#B7BED6',
    PHONE: '#1F2233',
    SCREEN: '#F6F7FA',
    SAND: '#CFCBDC',
  },
};
