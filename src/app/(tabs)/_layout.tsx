import Feather from '@expo/vector-icons/Feather';
import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useStore } from '@/store';
import { fonts, useColors } from '@/theme';

const icons = { index: 'home', practice: 'circle', progress: 'bar-chart-2', settings: 'settings' } as const;

export default function TabLayout() {
  const { t } = useTranslation();
  const c = useColors();
  const onboarded = useStore((s) => s.settings.onboarded);
  if (!onboarded) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.text3,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.divider },
        tabBarLabelStyle: { fontFamily: fonts.textMedium },
        tabBarIcon: ({ color, size }) => (
          <Feather name={icons[route.name as keyof typeof icons]} color={color as string} size={size} />
        ),
      })}>
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="practice" options={{ title: t('tabs.practice') }} />
      <Tabs.Screen name="progress" options={{ title: t('tabs.progress') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings') }} />
    </Tabs>
  );
}
