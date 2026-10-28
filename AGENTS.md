# Gvozdi

A calm companion for nail-board (Sadhu board) practice. One Expo codebase ships to iOS, Android and the web (PWA).

- GitHub `yeldynov/gvozdi`, EAS project `@shangnik/gvozdi`, web https://gvozdi.expo.app
- Bundle id / package: `com.shangnik.gvozdi`
- Account required (user decision): `Stack.Protected` in root `_layout` gates tabs/history/achievement on Clerk `isSignedIn`. Guests get onboarding, `/account` and one demo session; finishing it offers "create an account to keep it" (kept locally, pushed by `useSync` after sign-in). Earthy brand. Languages EN / UK / RU.
- MVP scope excludes: Library, Paywall, Board/Pure/Breath session variants, mood check-in, social sharing, web push.

## Stack

Expo SDK 58, Expo Router, react-native-web, TypeScript strict, React Compiler, typed routes. npm (`package-lock.json`), not bun.

- State: Zustand `persist` + AsyncStorage (localStorage on web), key `gvozdi`.
- i18n: i18next + expo-localization.
- Session: expo-keep-awake, expo-haptics, expo-audio (gong; mic and background playback disabled in `app.json`), react-native-svg (ring, Peak curve; also for charts — no chart library), expo-notifications (native only), Reanimated (breathing disc).
- Accounts + sync: Clerk (`@clerk/expo`, passwordless email code), Expo Router API routes (static output + `apiRoutes`), Drizzle + Neon (`@neondatabase/serverless` HTTP).
- Analytics: PostHog EU, `posthog-react-native` (native) / `posthog-js` (web, `analytics.web.ts`), opted out by default; `useAnalytics()` in root `_layout` mirrors `settings.analytics` into optIn/optOut and identifies signed-in users by Clerk id. `capture()` sends only when `settings.analytics === true`. While undecided, Home calls `GET /api/region` (EAS `eas-ip-country` header): EU/EEA/UK/CH (`needsConsent` in `src/lib/consent.ts`) get the consent card, everyone else and unknown/offline are auto-approved (user decision). Settings toggles; opt-out resets the SDK id; `EXPO_PUBLIC_POSTHOG_KEY` exists only in EAS `production`, so dev sends nothing.

## Layout

```
src/app/_layout.tsx          root: fonts, i18n, theme, Clerk (+ offline resourceCache), protected route groups (redirectTo)
src/app/+html.tsx            web shell: manifest, icons, theme-color, SW registration, beforeinstallprompt capture
public/sw.js                 network-first SW; on each load warms every route's HTML + JS chunks (add new routes to ROUTES)
src/app/(tabs)/              Home (index), Practice (session setup), Progress, Settings
src/app/onboarding.tsx       3 intro pages (signed-out only); last page: create account / have account / "try a session as a guest"
src/app/session.tsx          full-screen session: prepare gate → active (peak/timed/free) → save sheet / discard confirm → unlock screen; guests get GuestEnd (keep → /account, discard → /onboarding) instead of the save sheet; `store.running` persists the clock (resumed from Home on launch), `usePreventRemove` sends any back to the discard sheet
src/app/account.tsx          email → code; signs in, or signs up if the email is new (open to guests). Signed in: email + sign out (syncs, then clears local sessions so the next account starts clean)
src/app/api/region+api.ts    GET → { country } from EAS Hosting IP geolocation (null in dev)
src/app/api/sync+api.ts      POST /api/sync {since, changes} → {cursor, changes}; Clerk JWT, LWW upsert, rows scoped to user_id
src/server/db.ts             Drizzle schema + Neon client (server-only); migrations in drizzle/ (npm run db:generate / db:migrate)
src/lib/sync.ts              useSync(): pushes all sessions, pulls since cursor; runs after changes and on foreground while signed in
src/app/history/              list grouped by day (index) and detail with edit/delete ([id])
src/app/achievement/[id].tsx  badge, earned date or progress bar; unlock screen lives in session.tsx after save
src/components/menu.tsx      TabHead (top row of every tab + burger) → Sheet menu: guide, journal, FAQ, about, Telegram; PAGES registry
src/app/read/[id].tsx        reading page (guide/faq/about/articles); text in i18n `read.<id>` as {title, lead, sections[{h?, p[]}]}
src/app/journal.tsx          article list (PAGES with article: true), read time derived from word count
src/components/progress-visuals.tsx  DayBars (minutes per day), Badge (achievement icon)
src/components/session-visuals.tsx  TimerRing, PeakCurve, BreathDot
src/components/session-fields.tsx   TensionPicker, NoteInput, TENSION_ICONS, useFormatDay (shared by save sheet + history)
src/lib/session.ts           pure timer Clock (timestamp-based), Peak curve + captions, presets
src/lib/backup.ts            pure: serialize/parse, parseSession/parseSyncBody (validate untrusted JSON), mergeSessions (LWW, returns same array if unchanged)
src/lib/backup-io.ts         native export (share sheet) / import (document picker); backup-io.web.ts downloads / file input
src/lib/goal-alert.ts        native goal notification; goal-alert.web.ts is the no-op web twin
src/lib/analytics.ts         capture(event, props), useAnalytics(); .web.ts twin; events: app_opened, onboarding_completed, session_started/saved/discarded, achievement_unlocked, signed_in/up, install_prompted
src/components/install-hint.tsx  web-only Home card (.web twin); native no-op
src/lib/reminder.ts          native one-shot reminders for 14 days (`reminderDates`, skips a practised today), rescheduled from root _layout on launch/foreground/save/time/language; reminder.web.ts no-op
assets/sounds/gong.m4a       synthesized bowl tone
src/theme.ts                 useColors() light/dark (follows settings.theme), radius, space, fonts
src/components/ui.tsx        Screen, Txt (variants), Card, Button (ghost), Choice, Sheet (bottom modal), BackHeader (pushed screens) — reuse before adding new primitives
src/store.ts                 sessions + settings + running session; addSession returns the session; delete writes a tombstone
src/lib/types.ts             Session, Settings
src/lib/practice.ts          pure logic: streaks, achievements, stats, levels, 21-day program (todayMinutes), formatDuration
src/lib/*.test.ts            node:test asserts
src/i18n/{en,uk,ru}.json     translations
.eas/workflows/ship.yml      manual: web deploy + OTA update (eas workflow:run)
.github/workflows/ship.yml   push to main → web deploy + OTA update (GitHub Actions, EXPO_TOKEN = robot token)
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

- `+html.tsx` must render `headNodes`/`bodyNodes` from `useServerDocumentContext()`, or the export ships HTML with no JS.
- Fraunces has no Cyrillic: `Txt` display/title switch to Literata for UK/RU. Use `Txt` for headlines, not raw `fonts.display`.
- react-native-web ignores `accessibilityState`; use `aria-checked` / `aria-*` props.
- Icons/splash are rendered from one SVG mark by a throwaway headless-Chrome script; regenerate all PNGs together if the mark changes.
- Web output must stay `"static"` in `app.json`. `server` output crashed on EAS Hosting with SDK 58. API routes still work: `["expo-router", { "apiRoutes": true }]` exports prerendered HTML + `+api.ts` routes (verified on an EAS preview deploy, `src/app/api/health+api.ts`).
- TS 6 defaults `types` to `[]`, so test files need `/// <reference types="node" />`.
- Typed routes regenerate only while `npx expo start` runs. Don't set `CI=1` while editing; it disables file watching.
- `npm test` runs Node's native TS support (`node --test 'src/lib/*.test.ts'`), so tests must import with relative paths and avoid RN modules.
- Headless Chrome on macOS has a ~500px minimum width. Screenshot the web build with:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --window-size=600,900 --virtual-time-budget=30000 --screenshot=out.png http://localhost:8081`
  (add `--blink-settings=preferredColorScheme=1` for light mode).

## Secrets

- `.env.local` (gitignored) holds `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`; pull Clerk keys with `npx -y clerk@latest env pull`.
- EAS `production` env has the same three: publishable key `plaintext`, the other two `sensitive` (EAS Hosting can't deploy `secret`).
- Clerk: use the CLI (`npx -y clerk@latest`), not the Clerk MCP connector; they're signed into different workspaces. Test accounts: `name+clerk_test@example.com`, code `424242`. Web sign-up shows a bot check that headless Chrome can't pass; create the user with `clerk users create` and test the sign-in path.

## Shipping

- Pushing to `main` runs `.github/workflows/ship.yml` in GitHub Actions: deploys the PWA and publishes an OTA update to the `production` channel (the EAS workflow of the same name is manual-only; free-plan EAS CI minutes run out). Manual ship from this machine: `npx eas-cli@latest env:exec production "npx expo export -p web" && npx eas-cli@latest deploy --prod --environment production && npx eas-cli@latest update --channel production --environment production`. Commit and push at the end of each roadmap step.
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
8. Accounts: Clerk, `POST /api/sync` (last-write-wins on `updatedAt`, tombstones, rows scoped to `userId`) — done; Clerk stays on the dev instance until there is a custom domain (user decision). Later: app is account-gated with a guest demo session (replaced the sign-up prompt rule)
9. Polish: a11y, PWA install hint + service worker, icons/splash, PostHog — done (native icons/splash unseen until `eas build`). Store submission (`eas submit`, listings, privacy policy) is postponed: more features first. Contact email for listings/policy: yeldynov@gmail.com

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
