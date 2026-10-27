# Gvozdi

A calm companion for nail-board (Sadhu board) practice. One Expo codebase ships to iOS, Android and the web (PWA).

- Web: https://gvozdi.expo.app
- Every push to `main` deploys the PWA and publishes an OTA update to native builds (`.eas/workflows/ship.yml`).

```bash
npm install
npx expo start        # dev server (press w for web)
npm run typecheck && npx expo lint
```
