import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { ARTICLES, type Page } from '@/components/menu';
import { BackHeader, Card, Screen, Txt } from '@/components/ui';

export default function Journal() {
  const { t } = useTranslation();
  return (
    <Screen>
      <BackHeader title={t('common.back')} fallback="/" />
      <Txt variant="display">{t('menu.journal')}</Txt>
      <Txt variant="caption">{t('journal.intro')}</Txt>
      {ARTICLES.map((id) => {
        const page = t(`read.${id}`, { returnObjects: true }) as Page;
        const words = page.sections.flatMap((s) => s.p).join(' ').split(/\s+/).length;
        return (
          <Pressable
            key={id}
            accessibilityRole="link"
            onPress={() => router.push({ pathname: '/read/[id]', params: { id } })}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Card>
              <Txt variant="label">{t('journal.minutes', { count: Math.max(1, Math.round(words / 200)) })}</Txt>
              <Txt variant="title">{page.title}</Txt>
              <Txt variant="caption">{page.lead}</Txt>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}
