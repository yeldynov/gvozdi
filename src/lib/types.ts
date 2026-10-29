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

export type Settings = {
  language: Language;
  theme: ThemePref;
  sound: boolean;
  haptics: boolean;
  reminder?: string; // 'HH:mm'
  installHintDismissed?: boolean; // web only
  skipPrepare?: boolean; // short countdown instead of the full Steady screen
  program?: string; // dayKey the user joined the 21-day program; unset = not in it
  analytics?: boolean; // usage-stats consent; undefined = not asked yet, nothing is sent
};
