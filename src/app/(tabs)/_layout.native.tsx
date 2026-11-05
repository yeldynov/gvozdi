import Feather from '@expo/vector-icons/Feather';
import { VectorIcon } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useColors } from '@/theme';

// System tab bar: Liquid Glass on iOS 26+. On Android a quiet Material bar: no labels (so the
// active icon stays put), the page colour behind it and a faint tinted pill. Web uses the card in _layout.tsx.
const tabs = [
  { name: 'index', label: 'tabs.home', sf: 'house', feather: 'home' },
  { name: 'practice', label: 'tabs.practice', sf: 'circle', feather: 'circle' },
  { name: 'progress', label: 'tabs.progress', sf: 'chart.bar', feather: 'bar-chart-2' },
  { name: 'settings', label: 'tabs.settings', sf: 'gearshape', feather: 'settings' },
] as const;

export default function TabLayout() {
  const { t } = useTranslation();
  const c = useColors();
  return (
    <NativeTabs
      tintColor={c.primary}
      iconColor={{ default: c.text3, selected: c.primary }}
      backgroundColor={Platform.OS === 'android' ? c.bg : c.surface}
      labelVisibilityMode="unlabeled"
      indicatorColor={c.primary + '1f'}
      rippleColor={c.primary + '14'}>
      {tabs.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Icon
            sf={{ default: tab.sf, selected: `${tab.sf}.fill` }}
            src={<VectorIcon family={Feather} name={tab.feather} />}
          />
          <NativeTabs.Trigger.Label hidden>{t(tab.label)}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
