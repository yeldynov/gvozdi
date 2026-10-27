import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Card, Screen, Txt } from '@/components/ui';
import { currentStreak, suggestedMinutes } from '@/lib/practice';
import { useStore } from '@/store';

export default function Home() {
  const { t } = useTranslation();
  const sessions = useStore((s) => s.sessions);
  const streak = currentStreak(sessions);

  return (
    <Screen>
      <Txt variant="display">Gvozdi</Txt>
      <Txt variant="caption">{t('home.tagline')}</Txt>
      <Card>
        <Txt variant="title">{streak ? t('home.streak', { count: streak }) : t('home.noStreak')}</Txt>
      </Card>
      <Card>
        <Txt variant="label">{t('home.today')}</Txt>
        <Txt variant="title">{t('home.minutes', { count: suggestedMinutes(sessions) })}</Txt>
        <Button label={t('home.begin')} onPress={() => router.navigate('/practice')} />
      </Card>
    </Screen>
  );
}
