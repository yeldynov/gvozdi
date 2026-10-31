# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

One Expo codebase ships to iOS, Android and the web (installable PWA). One brand, but each platform's conventions are respected: native tabs (Liquid Glass on iOS 26), safe areas, system back, platform controls where they exist. Web is the primary verification surface until the first native build.

## Users

People who already own a nail board (Sadhu board) and want to turn standing on it into a steady daily habit. They open the app right before stepping on the board, often barefoot, phone propped nearby, sometimes in low light at the start or end of the day. During a session they glance rather than read. Markets: Ukrainian-, Russian- and English-speaking.

## Product Purpose

A calm practice companion for the board: start a session in one tap, get through the hardest first minutes, then see the habit grow. Success is a user who practises most days without feeling pushed, and whose sessions slowly lengthen.

## Positioning

Board-specific craft. Gvozdi is built for nails, not generic mindfulness: a prepare gate before stepping on, the Peak mode intensity curve (climbs to 1:30, eases by 7:00, with captions for each phase), a post-session tension rating, a 21-day program that lengthens sessions only on days you practise, and a guide written for board practice. A generic meditation or timer app cannot truthfully claim these.

## Operating Context

- Ritual: open app → (optional) choose mode/minutes → prepare screen → step on → session runs with keep-awake, haptics, gong at goal → step off → rate tension, add a note, save or discard.
- Session modes: Peak, Timed (countdown ring), Free (stopwatch). Presets and custom 1–90 min.
- Timers survive backgrounding, screen lock, reloads and process death; a running session resumes from Home.
- Between sessions: Home (today, streak tree + next milestone, week), Progress (streak, totals, day bars, achievements), History (by day, edit/delete), reading pages (guide, FAQ, about, journal articles).
- Account required (Clerk email code). Guests get onboarding and one demo session, then are invited to create an account to keep it.

## Capabilities and Constraints

- Tabs: Home, Practice, Progress, Settings. Burger menu on each tab: guide, journal, FAQ, about, 21-day program, Telegram.
- Streak, stats and achievements are derived from sessions, never stored. Achievements are expressed as a growing tree.
- Native reminders (14 days ahead, skip days already practised); none on web.
- JSON export/import, clear data, light/dark/system theme, opt-in analytics (consent card in EU/EEA/UK/CH).
- Languages EN / UK / RU; every string translated, with Slavic plural forms. Cyrillic must render in every typeface used.
- No `Alert`: confirmations are in-app modals (must work on web).
- Out of scope for the MVP: content library, paywall, extra session variants, mood check-in, social sharing, web push.

## Brand Commitments

- Name: Gvozdi ("nails").
- Earthy, calm tone of voice: gentle, unhurried, never guilt-tripping ("Miss a day and the program simply waits").
- The streak tree and the illustrated scenes (hero scene with clouds before today's practice, seated scene with tea after) stay as concepts; they may be redrawn in the new visual world.

## Evidence on Hand

- Copy in `src/i18n/{en,uk,ru}.json`, including long-form reading pages under `read.*`.
- Illustrations and kit in `src/components/scenes.tsx`, `src/components/guide-pics.tsx`; art in `assets/art`.
- Gong sound `assets/sounds/gong.m4a`; app mark/icons in `public/` and `assets/images`.
- Screenshots of the current look in `docs/screenshots/` (evidence of the old world, not a reference).
- No testimonials, user counts, reviews or press exist; do not fabricate any.

## Product Principles

1. The session is sacred: at the board, the screen asks nothing and shows only what helps in the moment.
2. Craft for the board over generic wellness: every feature should make sense only for nail-board practice.
3. Encourage, never pressure: gaps pause progress instead of breaking it; no guilt, no noise.
4. One tap to practise: the path from opening the app to standing on the board stays short.
5. Feels at home on each device: platform conventions first, brand through tint, type, illustration and motion.

## Accessibility & Inclusion

- Readable at a glance from a standing distance during a session; large timer, high contrast in light and dark.
- Respect Reduce Motion, Dynamic Type / font scale, and screen readers (use `aria-*` on web; react-native-web ignores `accessibilityState`).
- Touch targets 44pt (iOS) / 48dp (Android) minimum.
