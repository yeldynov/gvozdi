// Home's Today card behaviour, shared by every skin; each skin draws its own card around it.
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, Sheet, Step, TextLink, Txt } from '@/components/ui';
import { capture } from '@/lib/analytics';
import { programDay, todayMinutes, todaySec } from '@/lib/practice';
import { clampMinutes } from '@/lib/session';
import { useStore } from '@/store';
import { space } from '@/theme';

export function useToday() {
  const sessions = useStore((s) => s.sessions);
  const joined = useStore((s) => s.settings.program);
  const program = programDay(sessions, joined);
  const sec = todaySec(sessions);
  return { program, practised: sec > 0, done: Math.round(sec / 60), min: clampMinutes(todayMinutes(sessions, joined)) };
}

const closeProgram = () => useStore.getState().setSettings({ program: undefined });

/** Corner button: Practice tab, straight into setup. */
export function ChangeButton() {
  const { t } = useTranslation();
  return <Step icon="sliders" label={t('home.change')} onPress={() => router.navigate({ pathname: '/practice', params: { setup: String(Date.now()) } })} />;
}

/** Begin today's minutes, or (after practising) the Practice tab to confirm the saved setup first. */
export function BeginButton() {
  const { t } = useTranslation();
  const { practised, min } = useToday();
  const begin = () => {
    capture('session_started', { mode: 'timed', goal_min: min, customized: false, from: 'home' });
    router.push({ pathname: '/session', params: { mode: 'timed', min: String(min) } });
  };
  return (
    <Button
      label={practised ? t('home.again') : t('practice.beginFor', { min })}
      onPress={practised ? () => router.navigate('/practice') : begin}
      style={styles.wide}
    />
  );
}

export function ProgramFinished() {
  const { t } = useTranslation();
  return (
    <>
      <Txt variant="caption">{t('home.programFinished')}</Txt>
      <Button ghost label={t('common.close')} onPress={closeProgram} />
    </>
  );
}

/** "Leave the program" link with its confirmation sheet; nothing outside a running program. */
export function LeaveProgram() {
  const { t } = useTranslation();
  const { program } = useToday();
  const [open, setOpen] = useState(false);
  if (!program || program.finished) return null;
  const leave = () => {
    closeProgram();
    capture('program_left', { day: program.day });
    setOpen(false);
  };
  return (
    <>
      <TextLink label={t('home.leave')} onPress={() => setOpen(true)} />
      <Sheet visible={open} onClose={() => setOpen(false)}>
        <Txt variant="title">{t('home.leaveTitle')}</Txt>
        <Txt variant="caption">{t('home.leaveText')}</Txt>
        <View style={styles.row}>
          <Button ghost label={t('common.cancel')} onPress={() => setOpen(false)} style={styles.half} />
          <Button ghost label={t('home.leave')} onPress={leave} style={styles.half} />
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[3], marginTop: space[2] },
  half: { flex: 1, alignItems: 'center', paddingHorizontal: space[2] },
  wide: { alignSelf: 'stretch', alignItems: 'center', marginTop: space[2] },
});
