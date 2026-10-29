import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { InstallHint } from '@/components/install-hint';
import { TabHead } from '@/components/menu';
import { Art, Button, Card, Screen, Txt } from '@/components/ui';
import { needsConsent } from '@/lib/consent';
import { currentStreak, live, PROGRAM, programDay, todayMinutes } from '@/lib/practice';
import { useStore } from '@/store';
import { radius, space, useColors } from '@/theme';

export default function Home() {
  const { t } = useTranslation();
  const sessions = useStore((s) => s.sessions);
  const { analytics, program: joined } = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const c = useColors();
  const streak = currentStreak(sessions);
  const program = programDay(sessions, joined);

  // Consent is asked only in the EU/EEA/UK/CH (by IP country); elsewhere, or when the country is unknown, it's approved.
  const [askConsent, setAskConsent] = useState(false);
  useEffect(() => {
    if (analytics !== undefined) return;
    fetch('/api/region')
      .then((r) => r.json())
      .then(({ country }: { country?: string | null }) => country)
      .catch(() => null)
      .then((country) => (needsConsent(country) ? setAskConsent(true) : setSettings({ analytics: true })));
  }, [analytics, setSettings]);

  // Back to a session the OS killed or the browser reloaded.
  useEffect(() => {
    if (useStore.getState().running) router.push('/session');
  }, []);

  return (
    <Screen>
      <TabHead />
      <Art name={streak ? 'streak' : 'step'} size={200} />
      <Card>
        <Txt variant="title">{streak ? t('home.streak', { count: streak }) : t('home.noStreak')}</Txt>
      </Card>
      <Card>
        <Txt variant="label">
          {program && !program.finished ? t('home.programDay', { day: program.day, total: PROGRAM.length }) : t('home.today')}
        </Txt>
        <Txt variant="title">{t('home.minutes', { count: todayMinutes(sessions, joined) })}</Txt>
        {program && !program.finished && (
          <>
            <View style={styles.dots} accessibilityLabel={t('home.programDone', { done: program.done, total: PROGRAM.length })}>
              {PROGRAM.map((_, i) => (
                <View key={i} style={[styles.dot, { backgroundColor: i < program.done ? c.accent : c.divider }]} />
              ))}
            </View>
            <Txt variant="caption">{t('home.programText')}</Txt>
          </>
        )}
        <Button label={t('home.begin')} onPress={() => router.navigate('/practice')} />
      </Card>
      {analytics === undefined && askConsent && (
        <Card>
          <Txt variant="body">{t('home.consent')}</Txt>
          <Txt variant="caption">{t('home.consentText')}</Txt>
          <View style={styles.row}>
            <Button ghost label={t('home.consentNo')} onPress={() => setSettings({ analytics: false })} style={styles.half} />
            <Button ghost label={t('home.consentYes')} onPress={() => setSettings({ analytics: true })} style={styles.half} />
          </View>
        </Card>
      )}
      {live(sessions).length > 0 && <InstallHint />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: space[1], marginVertical: space[1] },
  dot: { width: 10, height: 10, borderRadius: radius.pill },
  row: { flexDirection: 'row', gap: space[3], marginTop: space[2] },
  half: { flex: 1, alignItems: 'center', paddingHorizontal: space[2] },
});
