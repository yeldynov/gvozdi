# Gvozdi

A calm companion for nail-board (Sadhu board) practice. One Expo codebase ships to iOS, Android and the web (PWA).

- GitHub `yeldynov/gvozdi`, EAS project `@shangnik/gvozdi`, web https://gvozdi.expo.app
- Bundle id / package: `com.shangnik.gvozdi`
- Guest-first (no login required; an occasional dismissible sign-up prompt comes later). Earthy brand. Languages EN / UK / RU.
- MVP scope excludes: Library, Paywall, Board/Pure/Breath session variants, mood check-in, social sharing, web push.

## Stack

Expo SDK 58, Expo Router, react-native-web, TypeScript strict, React Compiler, typed routes. npm (`package-lock.json`), not bun.

- State: Zustand `persist` + AsyncStorage (localStorage on web), key `gvozdi`.
- i18n: i18next + expo-localization.
- Session: expo-keep-awake, expo-haptics, expo-audio (gong; mic and background playback disabled in `app.json`), react-native-svg (ring, Peak curve; also for charts — no chart library), expo-notifications (native only), Reanimated (breathing disc).
- Planned: Clerk, Expo Router API routes + Drizzle + Neon for sync, PostHog.

## Layout

```
src/app/_layout.tsx          root: fonts, i18n, theme
src/app/(tabs)/              Home (index), Practice (session setup), Progress, Settings
src/app/onboarding.tsx       3 intro pages; (tabs)/_layout redirects here until settings.onboarded
src/app/session.tsx          full-screen session: prepare gate → active (peak/timed/free) → save sheet / discard confirm
src/app/history/              list grouped by day (index) and detail with edit/delete ([id])
src/app/achievement/[id].tsx  badge, earned date or progress bar; unlock screen lives in session.tsx after save
src/components/progress-visuals.tsx  DayBars (minutes per day), Badge (achievement icon)
src/components/session-visuals.tsx  TimerRing, PeakCurve, BreathDot
src/components/session-fields.tsx   TensionPicker, NoteInput, TENSION_ICONS, useFormatDay (shared by save sheet + history)
src/lib/session.ts           pure timer Clock (timestamp-based), Peak curve + captions, presets
src/lib/backup.ts            pure: serialize/parse (validates untrusted JSON), mergeSessions (last-write-wins by updatedAt)
src/lib/backup-io.ts         native export (share sheet) / import (document picker); backup-io.web.ts downloads / file input
src/lib/goal-alert.ts        native goal notification; goal-alert.web.ts is the no-op web twin
src/lib/reminder.ts          native daily reminder (fixed id, rescheduled from root _layout on time/language change); reminder.web.ts no-op
assets/sounds/gong.m4a       synthesized bowl tone
src/theme.ts                 useColors() light/dark (follows settings.theme), radius, space, fonts
src/components/ui.tsx        Screen, Txt (variants), Card, Button (ghost), Choice, Sheet (bottom modal), BackHeader (pushed screens) — reuse before adding new primitives
src/store.ts                 sessions + settings; addSession returns the session; delete writes a tombstone
src/lib/types.ts             Session, Settings
src/lib/practice.ts          pure logic: streaks, achievements, stats, levels, 21-day program (todayMinutes), formatDuration
src/lib/*.test.ts            node:test asserts
src/i18n/{en,uk,ru}.json     translations
.eas/workflows/ship.yml      push to main → web deploy + OTA update
```

## Conventions

- **Derive, don't store.** Streak, stats, achievements and levels are computed from sessions in `src/lib/practice.ts`, never persisted.
- **Sessions are never removed.** `deleteSession` sets `deletedAt` (tombstone for sync). Use `live()` from `practice.ts` for anything shown to the user. Every mutation bumps `updatedAt`.
- Pure logic goes in `src/lib/` with a `*.test.ts` next to it.
- Colors only via `useColors()`; spacing/radius/fonts from `src/theme.ts`. Check both light and dark.
- All user-facing text goes through i18n, in all three files. UK and RU plurals need `_one/_few/_many/_other`; EN needs `_one/_other`.
- No `Alert` (does nothing on web). Confirmations are in-app modals.
- Save/side effects in event handlers, never inside a state updater.
- Timers are timestamp-based (store `startedAt` + paused time, compute elapsed from the clock) so they survive backgrounding and screen lock.
- Native-only features (notifications, etc.) must degrade gracefully on web — use a `.web.ts` twin rather than `Platform.OS` checks around imports.
- Verify UI on web: with `npx expo start --web` running, `node scripts/web-drive.mjs "http://localhost:8081/session?mode=timed&min=1" /tmp/x click:Start wait:3000 shot:active` taps through flows and screenshots them.

## Checks

Run before every commit:

```bash
npx tsc --noEmit && npx expo lint && npm test
```

## Gotchas

- Web output must stay `"static"` in `app.json`. `server` output crashed on EAS Hosting with SDK 58.
- TS 6 defaults `types` to `[]`, so test files need `/// <reference types="node" />`.
- Typed routes regenerate only while `npx expo start` runs. Don't set `CI=1` while editing; it disables file watching.
- `npm test` runs Node's native TS support (`node --test src/lib/`), so tests must import with relative paths and avoid RN modules.
- Headless Chrome on macOS has a ~500px minimum width. Screenshot the web build with:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --window-size=600,900 --virtual-time-budget=30000 --screenshot=out.png http://localhost:8081`
  (add `--blink-settings=preferredColorScheme=1` for light mode).

## Shipping

- Pushing to `main` runs `.eas/workflows/ship.yml`: deploys the PWA and publishes an OTA update to the `production` channel. Commit and push at the end of each roadmap step.
- **No `eas build` until the MVP is done.** Native rebuilds are only needed when native dependencies change (runtime version uses the `fingerprint` policy).

## Roadmap

0. Scaffold + pipeline — done
1. Foundation (theme, fonts, i18n, store, practice logic, tabs) — done
2. Session timer (setup, prepare gate, peak/timed/free, keep-awake, haptics, gong, goal notification, save sheet) — done; native paths untested until the first `eas build`
3. History: grouped by day, detail with edit/delete — done (entry: Progress → All sessions)
4. Progress: streak card, totals, day-bar charts, achievements grid + detail, unlock screen after save — done
5. Onboarding (3 screens) and settings (export/import JSON, clear data, contact) — done; import merges, clear tombstones, contact = t.me/gvozdi_support_bot
6. Reminders (native daily notification; disabled row on web) — done; native path untested until the first `eas build`
7. Levels and a 21-day program — done; program advances per practice day (gaps pause), then todayMinutes falls back to suggestedMinutes
8. Accounts: Clerk, sign-up prompt rule (pure + tested), `POST /api/sync` (last-write-wins on `updatedAt`, tombstones, rows scoped to `userId`)
9. Polish and release: a11y, PWA install hint + service worker, icons/splash, store listings, `eas build`/`submit`, PostHog

Donor repos (copy from, never fork): `~/dev/gvozdi-app` (gvozdi-pwa: design tokens, `SessionActivePeak.jsx`, `SessionActiveNails.jsx`, copy), and `gh repo clone yeldynov/<name>` for `stepsure-ai` (translations, stats), `gvozdi-app`/`gvozdi-v6` (prepare/guide copy in UK/RU).

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. Before writing code that touches an Expo, EAS or React Native API:

1. Fetch the versioned docs: https://docs.expo.dev/versions/v58.0.0/
2. For anything else, fetch https://docs.expo.dev/llms.txt and follow its links. Never answer from memory.

```bash
npx expo install <package>  # ALWAYS instead of npm install — resolves SDK-compatible versions
npx expo start              # dev server (w for web)
npx expo-doctor             # diagnose dependency/config issues
npx expo install --fix      # fix incompatible versions
```

- Routes live in `src/app/` (every file is a screen, `_layout.tsx` defines navigators). Non-route code stays outside. Import `Link`, `router`, `useLocalSearchParams` from `expo-router`.
- `ios/` and `android/` are generated (CNG). Never create or edit them; configure native behavior via `app.json` and config plugins.
- Adding a library with native code changes the fingerprint runtime version, so OTA updates stop reaching existing native builds until the next `eas build`. That's accepted until the MVP is done: develop and verify on web, rebuild native once at the end.
- Prefer Expo modules over third-party libraries. Run EAS CLI as `npx eas-cli@latest <command>`.
