import { Fraunces_300Light } from '@expo-google-fonts/fraunces';
import { InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold } from '@expo-google-fonts/inter-tight';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

import i18n, { resolveLanguage } from '@/i18n';
import { syncReminder } from '@/lib/reminder';
import { useStore } from '@/store';
import { useColors } from '@/theme';

SplashScreen.preventAutoHideAsync();

const subscribeHydration = (cb: () => void) => useStore.persist.onFinishHydration(cb);
const isHydrated = () => useStore.persist.hasHydrated();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Fraunces_300Light, InterTight_400Regular, InterTight_500Medium, InterTight_600SemiBold });
  const hydrated = useSyncExternalStore(subscribeHydration, isHydrated, () => false);
  const language = useStore((s) => s.settings.language);
  const reminder = useStore((s) => s.settings.reminder);
  const { t, i18n: active } = useTranslation();
  const c = useColors();

  useEffect(() => {
    i18n.changeLanguage(resolveLanguage(language));
  }, [language]);

  // Reschedule when the time or the language of its text changes.
  useEffect(() => {
    if (hydrated) syncReminder(reminder, t('reminder.title'), t('reminder.body'));
  }, [hydrated, reminder, active.language, t]);

  const ready = fontsLoaded && hydrated;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return (
    <>
      <StatusBar style={c.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="session" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      </Stack>
    </>
  );
}
