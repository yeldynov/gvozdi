import Feather from '@expo/vector-icons/Feather';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NoteInput, TensionPicker } from '@/components/session-fields';
import { BreathDot, PeakCurve, TimerRing } from '@/components/session-visuals';
import { Button, Card, Sheet, Txt } from '@/components/ui';
import { cancelGoalAlert, scheduleGoalAlert } from '@/lib/goal-alert';
import { formatDuration } from '@/lib/practice';
import {
  clampMinutes,
  elapsedSec,
  PEAK_SEC,
  pauseClock,
  peakCaption,
  resumeClock,
  startClock,
  type Clock,
} from '@/lib/session';
import type { SessionMode, Tension } from '@/lib/types';
import { useStore } from '@/store';
import { fonts, radius, space, useColors } from '@/theme';

const gong = require('@/assets/sounds/gong.m4a');

const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));

// ponytail: the running session lives in component state, so an OS kill mid-session loses it; persist the Clock if that bites
export default function SessionScreen() {
  const params = useLocalSearchParams<{ mode?: string; min?: string }>();
  const mode: SessionMode = params.mode === 'free' || params.mode === 'timed' ? params.mode : 'peak';
  const goalSec = mode === 'free' ? 0 : clampMinutes(Number(params.min) || 5) * 60;
  const [started, setStarted] = useState(false);
  const c = useColors();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      {started ? (
        <Active mode={mode} goalSec={goalSec} />
      ) : (
        <Prepare mode={mode} goalSec={goalSec} onStart={() => setStarted(true)} />
      )}
    </SafeAreaView>
  );
}

function Prepare({ mode, goalSec, onStart }: { mode: SessionMode; goalSec: number; onStart: () => void }) {
  const { t } = useTranslation();
  const c = useColors();
  return (
    <View style={styles.page}>
      <TopBar onClose={leave} label={t(`practice.modes.${mode}`) + (goalSec ? ` · ${goalSec / 60} ${t('practice.min')}` : '')} />
      <View style={styles.center}>
        <BreathDot size={160} active color={c.primary} />
        <Txt variant="display" style={{ textAlign: 'center' }}>
          {t('session.prepareTitle')}
        </Txt>
        <Txt variant="body" style={{ textAlign: 'center', color: c.text2, maxWidth: 420 }}>
          {t('session.prepareText')}
        </Txt>
      </View>
      <Button label={t('session.start')} onPress={onStart} style={styles.wide} />
    </View>
  );
}

function Active({ mode, goalSec }: { mode: SessionMode; goalSec: number }) {
  useKeepAwake();
  const { t } = useTranslation();
  const c = useColors();
  const { sound, haptics } = useStore((s) => s.settings);
  const addSession = useStore((s) => s.addSession);
  const player = useAudioPlayer(gong);

  const [clock, setClock] = useState<Clock>(() => startClock(Date.now()));
  const [now, setNow] = useState(() => Date.now());
  const [sheet, setSheet] = useState<'save' | 'discard' | null>(null);
  const running = clock.pausedAt === null;
  const elapsed = elapsedSec(clock, now);
  const reached = goalSec > 0 && elapsed >= goalSec;

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  // Locked-screen cue: (re)scheduled on start/resume, cancelled on pause or when leaving.
  useEffect(() => {
    if (!goalSec || clock.pausedAt !== null) return;
    const id = scheduleGoalAlert(
      goalSec - elapsedSec(clock, Date.now()),
      t('session.notifyTitle'),
      t('session.notifyBody', { min: goalSec / 60 }),
    );
    return () => void id.then(cancelGoalAlert);
  }, [clock, goalSec, t]);

  // In-app cue, once.
  const cued = useRef(false);
  useEffect(() => {
    if (!reached || cued.current) return;
    cued.current = true;
    if (sound) {
      player.seekTo(0);
      player.play();
    }
    if (haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [reached, sound, haptics, player]);

  const toggle = () => {
    const at = Date.now();
    setClock(running ? pauseClock(clock, at) : resumeClock(clock, at));
    setNow(at);
  };

  const finish = () => {
    if (!elapsed) return leave();
    setClock(pauseClock(clock, Date.now()));
    setSheet('save');
  };

  const save = (tension: Tension | undefined, note: string) => {
    addSession({
      startedAt: new Date(clock.startedAt).toISOString(),
      durationSec: elapsed,
      mode,
      goalSec: goalSec || undefined,
      tension,
      note: note.trim() || undefined,
    });
    leave();
  };

  const status = !running ? t('session.paused') : reached ? t('session.goalReached') : t('session.standing');
  const big = (value: string, color = c.text) => <Text style={[styles.big, { color }]}>{value}</Text>;

  return (
    <View style={styles.page}>
      <TopBar
        onClose={() => (elapsed ? setSheet('discard') : leave())}
        label={mode === 'peak' ? undefined : t(`practice.modes.${mode}`)}
        chip={mode === 'peak' ? (elapsed < PEAK_SEC ? { text: t('session.peak'), color: c.accent } : { text: t('session.steady'), color: c.success }) : undefined}
      />

      {mode === 'peak' ? (
        <View style={styles.center}>
          <View style={{ alignItems: 'center', gap: space[1] }}>
            <Txt variant="label">{reached ? t('session.achieved') : t('session.remaining')}</Txt>
            {big(formatDuration(reached ? elapsed : goalSec - elapsed))}
            {reached ? (
              <Txt variant="body" style={{ color: c.text2 }}>
                {t('session.overGoal', { time: formatDuration(elapsed - goalSec) })}
              </Txt>
            ) : (
              elapsed < PEAK_SEC && (
                <View style={[styles.row, { gap: space[2] }]}>
                  <Txt variant="label">{t('session.peakEases')}</Txt>
                  <Text style={[styles.mid, { color: c.accent }]}>{formatDuration(PEAK_SEC - elapsed)}</Text>
                </View>
              )
            )}
          </View>
          <Card style={{ alignSelf: 'stretch', padding: space[3] }}>
            <Txt variant="caption" style={{ color: c.text3 }}>
              {t('session.curve')}
            </Txt>
            <PeakCurve elapsed={elapsed} total={goalSec} />
          </Card>
          <Txt variant="body" style={styles.caption}>
            {running ? t(`session.captions.${peakCaption(elapsed, goalSec)}`) : t('session.paused')}
          </Txt>
        </View>
      ) : (
        <View style={styles.center}>
          <Txt variant="body" style={{ color: reached ? c.success : c.text2 }}>
            {status}
          </Txt>
          <TimerRing
            running={running}
            color={reached ? c.success : c.primary}
            progress={goalSec ? elapsed / goalSec : (elapsed % 60) / 60}>
            {goalSec ? (
              <>
                {big(reached ? `+${formatDuration(elapsed - goalSec)}` : formatDuration(goalSec - elapsed), reached ? c.success : c.text)}
                <Txt variant="label">{t('session.goal', { time: formatDuration(goalSec) })}</Txt>
              </>
            ) : (
              <>
                {big(formatDuration(elapsed))}
                <Txt variant="label">{t('session.onBoard')}</Txt>
              </>
            )}
          </TimerRing>
        </View>
      )}

      <View style={[styles.row, { justifyContent: 'center', gap: space[5] }]}>
        <View style={styles.side} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={running ? t('session.pause') : t('session.resume')}
          onPress={toggle}
          style={[styles.play, { backgroundColor: c.primary }]}>
          <Feather name={running ? 'pause' : 'play'} size={26} color={c.onPrimary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('session.finish')}
          onPress={finish}
          style={[styles.side, { backgroundColor: c.bg2 }]}>
          <Feather name="check" size={20} color={c.text} />
        </Pressable>
      </View>

      <SaveSheet
        visible={sheet === 'save'}
        elapsed={elapsed}
        goalSec={goalSec}
        onSave={save}
        onClose={() => setSheet(null)}
      />
      <Sheet visible={sheet === 'discard'} onClose={() => setSheet(null)}>
        <Txt variant="title">{t('session.discardTitle')}</Txt>
        <Txt variant="body" style={{ color: c.text2 }}>
          {t('session.discardText', { time: formatDuration(elapsed) })}
        </Txt>
        <View style={styles.row}>
          <Button ghost label={t('session.discard')} onPress={leave} style={styles.half} />
          <Button label={t('session.keepGoing')} onPress={() => setSheet(null)} style={styles.half} />
        </View>
      </Sheet>
    </View>
  );
}

function SaveSheet({
  visible,
  elapsed,
  goalSec,
  onSave,
  onClose,
}: {
  visible: boolean;
  elapsed: number;
  goalSec: number;
  onSave: (tension: Tension | undefined, note: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const c = useColors();
  const [tension, setTension] = useState<Tension>();
  const [note, setNote] = useState('');

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt variant="title">{t('session.saveTitle')}</Txt>
      <View style={[styles.row, { gap: space[3] }]}>
        <Text style={[styles.mid, { fontSize: 40, color: c.text }]}>{formatDuration(elapsed)}</Text>
        {goalSec > 0 &&
          (elapsed >= goalSec ? (
            <Txt variant="caption" style={{ color: c.success }}>
              ✓ {t('session.reached')}
            </Txt>
          ) : (
            <Txt variant="caption">{t('session.ofGoal', { time: formatDuration(goalSec) })}</Txt>
          ))}
      </View>
      <TensionPicker value={tension} onChange={setTension} />
      <NoteInput value={note} onChange={setNote} />
      <View style={styles.row}>
        <Button ghost label={t('common.cancel')} onPress={onClose} style={styles.half} />
        <Button label={t('session.save')} onPress={() => onSave(tension, note)} style={styles.half} />
      </View>
    </Sheet>
  );
}

function TopBar({ onClose, label, chip }: { onClose: () => void; label?: string; chip?: { text: string; color: string } }) {
  const { t } = useTranslation();
  const c = useColors();
  return (
    <View style={[styles.row, { justifyContent: 'space-between' }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={12}>
        <Feather name="x" size={24} color={c.text2} />
      </Pressable>
      {chip ? (
        <View style={[styles.chip, { backgroundColor: chip.color }]}>
          <Text style={[styles.chipText, { color: c.onPrimary }]}>{chip.text}</Text>
        </View>
      ) : (
        <Txt variant="label">{label}</Txt>
      )}
      <View style={{ width: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: space[6], gap: space[5], width: '100%', maxWidth: 560, alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[5] },
  row: { flexDirection: 'row', alignItems: 'center' },
  wide: { alignSelf: 'stretch', alignItems: 'center' },
  half: { flex: 1, alignItems: 'center' },
  big: { fontFamily: fonts.display, fontSize: 64, lineHeight: 72, fontVariant: ['tabular-nums'] },
  mid: { fontFamily: fonts.textMedium, fontSize: 22, fontVariant: ['tabular-nums'] },
  caption: { textAlign: 'center', fontFamily: fonts.textMedium, fontSize: 17, lineHeight: 25, minHeight: 50 },
  play: { width: 72, height: 72, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  side: { width: 52, height: 52, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  chip: { borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: space[3] },
  chipText: { fontFamily: fonts.textBold, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase' },
});
