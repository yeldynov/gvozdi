import { useAuth } from '@clerk/expo';
import Constants from 'expo-constants';
import { posthog } from 'posthog-js';
import { useEffect } from 'react';

import { useStore } from '@/store';

// posthog-js twin of analytics.ts. Static export renders on the server, so init only in the browser.
const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY; // set only in EAS production, so dev runs send nothing

const client =
  KEY && typeof window !== 'undefined'
    ? (posthog.init(KEY, {
        api_host: 'https://eu.i.posthog.com',
        defaults: '2025-05-24', // pageviews on history change (Expo Router navigations)
        opt_out_capturing_by_default: true, // nothing is sent until settings.analytics is true
        persistence: 'localStorage', // no cookies
        person_profiles: 'identified_only',
        disable_session_recording: true,
        disable_surveys: true,
      }) ?? posthog)
    : undefined;
client?.register({ app_version: Constants.expoConfig?.version });

type Props = Record<string, string | number | boolean | undefined>;

export function capture(event: string, properties: Props = {}) {
  if (useStore.getState().settings.analytics !== true) return; // opt-in only
  client?.capture(event, properties);
}

/** Mirrors the consent setting into the SDK and ties events to the Clerk user while signed in. Mount once inside ClerkProvider. */
export function useAnalytics() {
  const analytics = useStore((s) => s.settings.analytics);
  const { userId } = useAuth();
  useEffect(() => {
    if (!client) return;
    if (analytics) client.opt_in_capturing();
    else {
      client.reset(); // before opting out: reset after opt-in would silently stop capturing
      client.opt_out_capturing();
    }
  }, [analytics]);
  useEffect(() => {
    if (!client || !analytics) return;
    if (userId) client.identify(userId);
    else if (client.get_property('$user_state') === 'identified') {
      client.reset(); // signed out
      client.opt_in_capturing();
    }
  }, [userId, analytics]);
}
