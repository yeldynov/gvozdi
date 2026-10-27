import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';
import { Platform } from 'react-native';

import { useStore } from '@/store';

// PostHog capture API without the SDK: same code on native and web, no native deps.
// ponytail: one request per event, no offline queue; switch to posthog-react-native if we need replay or batching.
const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY; // set only in EAS production, so dev runs send nothing
const HOST = 'https://eu.i.posthog.com';

export function capture(event: string, properties: Record<string, string | number | boolean | undefined> = {}) {
  if (!KEY) return;
  const { settings, setSettings } = useStore.getState();
  let id = settings.analyticsId;
  if (!id) {
    id = randomUUID();
    setSettings({ analyticsId: id });
  }
  fetch(`${HOST}/i/v0/e/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: KEY,
      event,
      distinct_id: id,
      properties: { ...properties, $os: Platform.OS, app_version: Constants.expoConfig?.version, $process_person_profile: false },
    }),
  }).catch(() => {});
}
