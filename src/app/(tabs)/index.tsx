import { useAuth } from '@clerk/expo';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { InstallHint } from '@/components/install-hint';
import { Button, Card, Screen, Txt } from '@/components/ui';
import { currentStreak, live, PROGRAM, programDay, todayMinutes } from '@/lib/practice';
import { useStore } from '@/store';
import { radius, space, useColors } from '@/theme';

export default function Home() {
  const { t } = useTranslation();
  const sessions = useStore((s) => s.sessions);
  const analytics = useStore((s) => s.settings.analytics);
  const setSettings = useStore((s) => s.setSettings);
  const c = useColors();
  const streak = currentStreak(sessions);
  const program = programDay(sessions);
  const { isLoaded, isSignedIn } = useAuth();

  // Back to a session the OS killed or the browser reloaded.
  useEffect(() => {
    if (useStore.getState().running) router.push('/session');
  }, []);

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
                <View key={i} style={[styles.dot, { backgroundColor: i < program.done ? c.accent : c.divider }]} />
              ))}
            </View>
            <Txt variant="caption">{t('home.programText')}</Txt>
          </>
        )}
        <Button label={t('home.begin')} onPress={() => router.navigate('/practice')} />
      </Card>
      {analytics === undefined && (
        <Card>
          <Txt variant="body">{t('home.consent')}</Txt>
          <Txt variant="caption">{t('home.consentText')}</Txt>
          <View style={styles.row}>
            <Button ghost label={t('home.consentNo')} onPress={() => setSettings({ analytics: false })} style={styles.half} />
            <Button ghost label={t('home.consentYes')} onPress={() => setSettings({ analytics: true })} style={styles.half} />
          </View>
        </Card>
      )}
      {isLoaded && !isSignedIn && live(sessions).length > 0 && (
        <Pressable accessibilityRole="button" onPress={() => router.push('/account')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Card style={styles.backup}>
            <Feather name="cloud" size={20} color={c.text2} />
            <View style={{ flex: 1 }}>
              <Txt variant="body">{t('home.backup')}</Txt>
              <Txt variant="caption">{t('home.backupText')}</Txt>
            </View>
            <Feather name="chevron-right" size={20} color={c.text3} />
          </Card>
        </Pressable>
      )}
      {live(sessions).length > 0 && <InstallHint />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: space[1], marginVertical: space[1] },
  backup: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[4] },
  dot: { width: 10, height: 10, borderRadius: radius.pill },
  row: { flexDirection: 'row', gap: space[3], marginTop: space[2] },
  half: { flex: 1, alignItems: 'center', paddingHorizontal: space[2] },
});
