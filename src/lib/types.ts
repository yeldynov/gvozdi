export type SessionMode = 'free' | 'timed' | 'peak';
export type Tension = 'intense' | 'tense' | 'mild' | 'easy';

export type Session = {
  id: string;
  startedAt: string; // ISO
  durationSec: number;
  mode: SessionMode;
  goalSec?: number;
  tension?: Tension;
  note?: string;
  updatedAt: string; // ISO, last-write-wins for sync
  deletedAt?: string; // tombstone, kept for sync
};

export type Language = 'system' | 'en' | 'uk' | 'ru';
export type ThemePref = 'system' | 'light' | 'dark';
export type Skin = 'earthy' | 'herbarium';

export type HomeCard = 'today' | 'stats' | 'week';

export type Settings = {
  language: Language;
  theme: ThemePref;
  skin?: Skin; // unset = earthy
  sound: boolean;
  haptics: boolean;
  reminder?: string; // 'HH:mm'
  installHintDismissed?: boolean; // web only
  skipPrepare?: boolean; // short countdown instead of the full Steady screen
  program?: string; // dayKey the user joined the 21-day program; unset = not in it
  programAsked?: boolean; // the program invite was dismissed
  practice?: { mode: SessionMode; min: number }; // last setup on the Practice tab; unset = free
  home?: HomeCard[]; // visible Home cards in order; unset = DEFAULT_HOME
  analytics?: boolean; // usage-stats consent; undefined = not asked yet, nothing is sent
};
