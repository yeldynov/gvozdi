import { ClerkProvider, useAuth } from '@clerk/expo';
import { resourceCache } from '@clerk/expo/resource-cache';
import { tokenCache } from '@clerk/expo/token-cache';
import { Fraunces_300Light } from '@expo-google-fonts/fraunces';
import { GolosText_400Regular, GolosText_500Medium, GolosText_600SemiBold } from '@expo-google-fonts/golos-text';
import { Literata_300Light } from '@expo-google-fonts/literata';
import { InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold } from '@expo-google-fonts/inter-tight';
import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Screen, Txt } from '@/components/ui';
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
  const [fontsLoaded] = useFonts({ Fraunces_300Light, Literata_300Light, InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold, GolosText_400Regular, GolosText_500Medium, GolosText_600SemiBold });
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

// A render error would otherwise leave a blank screen (and crash the next launch); show it with a way out.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  return (
    <Screen>
      <Txt variant="title">{t('common.error')}</Txt>
      <Txt variant="caption" selectable>
        {error.message}
        {'\n\n'}
        {error.stack?.split('\n').slice(0, 8).join('\n')}
      </Txt>
      <Button label={t('common.retry')} onPress={retry} />
    </Screen>
  );
}

// Hooks that need Clerk: data sync and analytics identity/consent.
function Background() {
  useSync();
  useAnalytics();
  return null;
}
