import { useTranslation } from 'react-i18next';

import { Card, Choice, Screen, Txt } from '@/components/ui';
import type { Language, ThemePref } from '@/lib/types';
import { useStore } from '@/store';

export default function Settings() {
  const { t } = useTranslation();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);

  return (
    <Screen>
      <Txt variant="display">{t('settings.title')}</Txt>
      <Card>
        <Txt variant="label">{t('settings.language')}</Txt>
        <Choice<Language>
          value={settings.language}
          onChange={(language) => setSettings({ language })}
          options={[
            { value: 'system', label: t('settings.system') },
            { value: 'en', label: 'English' },
            { value: 'uk', label: 'Українська' },
            { value: 'ru', label: 'Русский' },
          ]}
        />
      </Card>
      <Card>
        <Txt variant="label">{t('settings.theme')}</Txt>
        <Choice<ThemePref>
          value={settings.theme}
          onChange={(theme) => setSettings({ theme })}
          options={[
            { value: 'system', label: t('settings.system') },
            { value: 'light', label: t('settings.light') },
            { value: 'dark', label: t('settings.dark') },
          ]}
        />
      </Card>
    </Screen>
  );
}
