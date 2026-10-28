import { ClerkProvider, useAuth } from '@clerk/expo';
import { resourceCache } from '@clerk/expo/resource-cache';
import { tokenCache } from '@clerk/expo/token-cache';
import { Fraunces_300Light } from '@expo-google-fonts/fraunces';
import { Literata_300Light } from '@expo-google-fonts/literata';
import { InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold } from '@expo-google-fonts/inter-tight';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';

import i18n, { resolveLanguage } from '@/i18n';
import { capture, useAnalytics } from '@/lib/analytics';
import { dayKey, live } from '@/lib/practice';
import { syncReminder } from '@/lib/reminder';
import { useSync } from '@/lib/sync';
import { useStore } from '@/store';
import { useColors } from '@/theme';

SplashScreen.preventAutoHideAsync();

const subscribeHydration = (cb: () => void) => useStore.persist.onFinishHydration(cb);
const isHydrated = () => useStore.persist.hasHydrated();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fraunces_300Light, Literata_300Light, InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold });
  const hydrated = useSyncExternalStore(subscribeHydration, isHydrated, () => false);
  const language = useStore((s) => s.settings.language);
  const reminder = useStore((s) => s.settings.reminder);
  const sessions = useStore((s) => s.sessions);
  const { t, i18n: active } = useTranslation();
  const c = useColors();

  useEffect(() => {
    i18n.changeLanguage(resolveLanguage(language));
  }, [language]);

  // Reschedule on launch, on foreground (the 14-day window moves on), and when the time, today's practice or the language changes.
  useEffect(() => {
    if (!hydrated) return;
    const sync = () => {
      const today = dayKey(new Date()); // read at call time: a foreground may be the next day
      const practised = live(sessions).some((x) => dayKey(new Date(x.startedAt)) === today);
      syncReminder(reminder, practised, t('reminder.title'), t('reminder.body'));
    };
    sync();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && sync());
    return () => sub.remove();
  }, [hydrated, reminder, sessions, active.language, t]);

  if (!fontsLoaded || !hydrated) return null;
  return (
    // resourceCache: native only; lets Clerk restore the signed-in user offline instead of bouncing to onboarding.
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
      __experimental_resourceCache={resourceCache}>
      <Background />
      <StatusBar style={c.isDark ? 'light' : 'dark'} />
      <Routes />
    </ClerkProvider>
  );
}

// The app is for signed-in users; guests get onboarding, the account screen and one demo session.
function Routes() {
  const { isLoaded, isSignedIn } = useAuth();
  const c = useColors();
  const { i18n: active } = useTranslation();
  useEffect(() => {
    if (!isLoaded) return;
    SplashScreen.hideAsync();
    capture('app_opened', { language: active.language });
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps -- once per launch

  if (!isLoaded) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Protected guard={!!isSignedIn} redirectTo="/onboarding">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="history/index" />
        <Stack.Screen name="history/[id]" />
        <Stack.Screen name="achievement/[id]" />
        <Stack.Screen name="journal" />
        <Stack.Screen name="read/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn} redirectTo="/">
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Screen name="account" />
      <Stack.Screen name="sso-callback" />
      <Stack.Screen name="session" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
    </Stack>
  );
}

// Hooks that need Clerk: data sync and analytics identity/consent.
function Background() {
  useSync();
  useAnalytics();
  return null;
}
