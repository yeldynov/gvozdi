import { useAuth } from '@clerk/expo';
import Constants from 'expo-constants';
import PostHog from 'posthog-react-native';
import { useEffect } from 'react';

import { useStore } from '@/store';

// PostHog SDK (EU). analytics.web.ts is the posthog-js twin with the same exports.
const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY; // set only in EAS production, so dev runs send nothing

const client = KEY
  ? new PostHog(KEY, {
      host: 'https://eu.i.posthog.com',
      defaultOptIn: false, // nothing leaves the device until settings.analytics is true
      captureAppLifecycleEvents: true,
      personProfiles: 'identified_only',
    })
  : undefined;
client?.register({ app_version: Constants.expoConfig?.version ?? 'unknown' });

type Props = Record<string, string | number | boolean | undefined>;

export function capture(event: string, properties: Props = {}) {
  if (useStore.getState().settings.analytics !== true) return; // opt-in only
  client?.capture(event, JSON.parse(JSON.stringify(properties))); // drops undefined values
}

/** Mirrors the consent setting into the SDK and ties events to the Clerk user while signed in. Mount once inside ClerkProvider. */
export function useAnalytics() {
  const analytics = useStore((s) => s.settings.analytics);
  const { userId } = useAuth();
  useEffect(() => {
    if (!client) return;
    if (analytics) client.optIn();
    else {
      client.optOut();
      client.reset(); // a fresh anonymous id if they opt back in
    }
  }, [analytics]);
  useEffect(() => {
    if (!client || !analytics) return;
    if (userId) client.identify(userId);
    else if (client.getDistinctId() !== client.getAnonymousId()) client.reset(); // signed out
  }, [userId, analytics]);
}
