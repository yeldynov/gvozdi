import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { NoteInput, TensionPicker, useFormatDay } from '@/components/session-fields';
import { BackHeader, Button, Screen, Sheet, Txt } from '@/components/ui';
import { dayKey, formatDuration } from '@/lib/practice';
import type { Session } from '@/lib/types';
import { useStore } from '@/store';
import { fonts, space, useColors } from '@/theme';

const leave = () => (router.canGoBack() ? router.back() : router.replace('/history'));

export default function SessionDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useStore((s) => s.sessions.find((x) => x.id === id && !x.deletedAt));

  return (
    <Screen>
      <BackHeader title={t('history.title')} fallback="/history" />
      {session ? <Detail key={session.id} session={session} /> : <Txt>{t('history.notFound')}</Txt>}
    </Screen>
  );
}

function Detail({ session }: { session: Session }) {
  const { t, i18n } = useTranslation();
  const c = useColors();
  const formatDay = useFormatDay();
  const updateSession = useStore((s) => s.updateSession);
  const deleteSession = useStore((s) => s.deleteSession);
  const [tension, setTension] = useState(session.tension);
  const [note, setNote] = useState(session.note ?? '');
  const [confirming, setConfirming] = useState(false);

  const start = new Date(session.startedAt);
  const day = formatDay(dayKey(start));
  const time = formatDuration(session.durationSec);

  const save = () => {
    updateSession(session.id, { tension, note: note.trim() || undefined });
    leave();
  };
  const remove = () => {
    setConfirming(false);
    deleteSession(session.id);
    leave();
  };

  return (
    <>
      <View style={{ gap: space[1] }}>
        <Txt variant="label">
          {day} · {start.toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit' })}
        </Txt>
        <Txt style={[styles.big, { color: c.text }]}>{time}</Txt>
        <Txt variant="caption">
          {t(`practice.modes.${session.mode}`)}
          {session.goalSec ? ` · ${t('session.goal', { time: formatDuration(session.goalSec) })}` : ''}
          {session.goalSec && session.durationSec >= session.goalSec ? ` · ✓ ${t('session.reached')}` : ''}
        </Txt>
      </View>

      <TensionPicker value={tension} onChange={setTension} />
      <NoteInput value={note} onChange={setNote} />

      <View style={styles.row}>
        <Button ghost label={t('history.delete')} onPress={() => setConfirming(true)} style={styles.half} />
        <Button label={t('session.save')} onPress={save} style={styles.half} />
      </View>

      <Sheet visible={confirming} onClose={() => setConfirming(false)}>
        <Txt variant="title">{t('history.deleteTitle')}</Txt>
        <Txt style={{ color: c.text2 }}>{t('history.deleteText', { time })}</Txt>
        <View style={styles.row}>
          <Button ghost label={t('common.cancel')} onPress={() => setConfirming(false)} style={styles.half} />
          <Button label={t('history.delete')} onPress={remove} style={[styles.half, { backgroundColor: c.error }]} />
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[3] },
  half: { flex: 1, alignItems: 'center' },
  big: { fontFamily: fonts.display, fontSize: 56, lineHeight: 64, fontVariant: ['tabular-nums'] },
});
