import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { radius, space, useColors } from '@/theme';

const icons = { index: 'home', practice: 'circle', progress: 'bar-chart-2', settings: 'settings' } as const;
const web = Platform.OS === 'web';

export default function TabLayout() {
  const { t } = useTranslation();
  const c = useColors();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.text3,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.divider,
          // Web: a floating card as wide as Screen's cards (560 column minus its space[5] padding).
          ...(web && {
            width: Math.min(width, 560) - 2 * space[5],
            alignSelf: 'center',
            borderColor: c.divider,
            borderWidth: StyleSheet.hairlineWidth,
            borderBottomLeftRadius: radius.lg,
            borderBottomRightRadius: radius.lg,
            height: 56,
            marginBottom: insets.bottom + space[4],
          }),
        },
        // Icons only; the title stays as each tab's accessibility label.
        tabBarShowLabel: false,
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
