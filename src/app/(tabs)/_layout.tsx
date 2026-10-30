import Feather from '@expo/vector-icons/Feather';
import { VectorIcon } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from 'react-i18next';

import { useColors } from '@/theme';

// System tab bar: Liquid Glass on iOS 26+, Material on Android. Web has its own bar in _layout.web.tsx.
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
    <NativeTabs tintColor={c.primary} iconColor={{ default: c.text3, selected: c.primary }} backgroundColor={c.surface} indicatorColor={c.bg3}>
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
