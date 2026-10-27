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
  onboarded: boolean;
  signupPrompt: SignupPrompt;
  installHintDismissed?: boolean; // web only
  analyticsId?: string; // anonymous PostHog distinct_id
};

export type SignupPrompt = { lastShownAt?: string; shownAtCount?: number; dismissals: number };
