import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Txt } from '@/components/ui';
import { currentStreak, PROGRAM, programDay, todayMinutes } from '@/lib/practice';
import { useStore } from '@/store';
import { radius, space, useColors } from '@/theme';

export default function Home() {
  const { t } = useTranslation();
  const sessions = useStore((s) => s.sessions);
  const c = useColors();
  const streak = currentStreak(sessions);
  const program = programDay(sessions);

  return (
    <Screen>
      <Txt variant="display">Gvozdi</Txt>
      <Txt variant="caption">{t('home.tagline')}</Txt>
      <Card>
        <Txt variant="title">{streak ? t('home.streak', { count: streak }) : t('home.noStreak')}</Txt>
      </Card>
      <Card>
        <Txt variant="label">
          {program ? t('home.programDay', { day: program.day, total: PROGRAM.length }) : t('home.today')}
        </Txt>
        <Txt variant="title">{t('home.minutes', { count: todayMinutes(sessions) })}</Txt>
        {program && (
          <>
            <View style={styles.dots} accessibilityLabel={t('home.programDone', { done: program.done, total: PROGRAM.length })}>
              {PROGRAM.map((_, i) => (
                <View key={i} style={[styles.dot, { backgroundColor: i < program.done ? c.accent : c.bg3 }]} />
              ))}
            </View>
            <Txt variant="caption">{t('home.programText')}</Txt>
          </>
        )}
        <Button label={t('home.begin')} onPress={() => router.navigate('/practice')} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: space[1], marginVertical: space[1] },
  dot: { width: 10, height: 10, borderRadius: radius.pill },
});
