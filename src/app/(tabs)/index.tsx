import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { InstallHint } from '@/components/install-hint';
import { TabHead } from '@/components/menu';
import { Badge, DayBars, Tree, treeGround } from '@/components/progress-visuals';
import { Art, Button, Card, Screen, Sheet, Step, TextLink, Txt } from '@/components/ui';
import { capture } from '@/lib/analytics';
import { needsConsent } from '@/lib/consent';
import { currentStreak, dayKey, lastDays, live, nextAchievement, PROGRAM, programDay, todayMinutes, todaySec, treeStage } from '@/lib/practice';
import { clampMinutes } from '@/lib/session';
import type { HomeCard } from '@/lib/types';
import { useStore } from '@/store';
import { radius, space, useColors } from '@/theme';

const DEFAULT_HOME: HomeCard[] = ['today', 'stats', 'week'];
const CARDS: Record<HomeCard, () => ReactNode> = { today: Today, stats: Stats, week: Week };

export default function Home() {
  const { t } = useTranslation();
  const sessions = useStore((s) => s.sessions);
  const { analytics, program, programAsked } = useStore((s) => s.settings);
  const home = useHome();
  const setSettings = useStore((s) => s.setSettings);
  const [customize, setCustomize] = useState(false);
  const streak = currentStreak(sessions);

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
      <TextLink label={t('home.customize')} onPress={() => setCustomize(true)} style={styles.customize} />
      {!program && !programAsked && live(sessions).length > 0 && (
        <Card>
          <View style={styles.corner}>
            <Step icon="x" label={t('home.notNow')} onPress={() => setSettings({ programAsked: true })} />
          </View>
          <Txt variant="title" style={styles.cornerPad}>
            {t('home.invite')}
          </Txt>
          <Txt variant="caption">{t('home.inviteText')}</Txt>
          <View style={styles.row}>
            <Button ghost label={t('home.readMore')} onPress={() => router.push('/read/program')} style={styles.half} />
            <Button label={t('home.join')} onPress={joinProgram} style={styles.half} />
          </View>
        </Card>
      )}
      {home.map((id) => {
        const C = CARDS[id];
        return <C key={id} />;
      })}
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
      <Customize visible={customize} onClose={() => setCustomize(false)} />
    </Screen>
  );
}

/** Saved card order, minus ids from older versions. */
function useHome() {
  const saved = useStore((s) => s.settings.home);
  return saved ? saved.filter((id) => id in CARDS) : DEFAULT_HOME;
}

function joinProgram() {
  useStore.getState().setSettings({ program: dayKey(new Date()) });
  capture('program_joined', { from: 'home' });
}

function Today() {
  const { t } = useTranslation();
  const c = useColors();
  const sessions = useStore((s) => s.sessions);
  const joined = useStore((s) => s.settings.program);
  const setSettings = useStore((s) => s.setSettings);
  const [leaving, setLeaving] = useState(false);
  const program = programDay(sessions, joined);
  const done = Math.round(todaySec(sessions) / 60);
  const practised = todaySec(sessions) > 0;
  const min = clampMinutes(todayMinutes(sessions, joined));

  const begin = () => {
    capture('session_started', { mode: 'timed', goal_min: min, customized: false, from: 'home' });
    router.push({ pathname: '/session', params: { mode: 'timed', min: String(min) } });
  };
  const leave = () => {
    setSettings({ program: undefined });
    capture('program_left', { day: program?.day });
    setLeaving(false);
  };

  return (
    <Card>
      <View style={styles.corner}>
        <Step icon="sliders" label={t('home.change')} onPress={() => router.navigate({ pathname: '/practice', params: { setup: String(Date.now()) } })} />
      </View>
      <Txt variant="label" style={styles.cornerPad}>
        {program && !program.finished ? t('home.programDay', { day: program.day, total: PROGRAM.length }) : t('home.today')}
      </Txt>
      <View style={[styles.titleRow, styles.cornerPad]}>
        {practised && <Feather name="check-circle" size={22} color={c.accent} />}
        <Txt variant="title">{practised ? t('home.doneToday', { count: done }) : t('home.suggested', { count: min })}</Txt>
      </View>
      {program?.finished ? (
        <>
          <Txt variant="caption">{t('home.programFinished')}</Txt>
          <Button ghost label={t('common.close')} onPress={() => setSettings({ program: undefined })} />
        </>
      ) : (
        program && (
          <>
            <View style={styles.dots} accessibilityLabel={t('home.programDone', { done: program.done, total: PROGRAM.length })}>
              {PROGRAM.map((_, i) => (
                <View key={i} style={[styles.dot, { backgroundColor: i < program.done ? c.accent : c.divider }]} />
              ))}
            </View>
            <Txt variant="caption">{t('home.programText')}</Txt>
          </>
        )
      )}
      <Button
        label={practised ? t('home.again') : t('practice.beginFor', { min })}
        onPress={practised ? () => router.navigate('/practice') : begin} // again: confirm the saved practice first
        style={styles.wide}
      />
      {program && !program.finished && <TextLink label={t('home.leave')} onPress={() => setLeaving(true)} />}
      <Sheet visible={leaving} onClose={() => setLeaving(false)}>
        <Txt variant="title">{t('home.leaveTitle')}</Txt>
        <Txt variant="caption">{t('home.leaveText')}</Txt>
        <View style={styles.row}>
          <Button ghost label={t('common.cancel')} onPress={() => setLeaving(false)} style={styles.half} />
          <Button ghost label={t('home.leave')} onPress={leave} style={styles.half} />
        </View>
      </Sheet>
    </Card>
  );
}

const toProgress = () => router.navigate('/progress');
const toStages = () => router.navigate({ pathname: '/progress', params: { stages: '1' } });

/** Two square tiles: the streak over its tree, and the next achievement. Both open Progress. */
function Stats() {
  const { t } = useTranslation();
  const c = useColors();
  const sessions = useStore((s) => s.sessions);
  const [w, setW] = useState(0); // tile width: art and numbers scale with it
  const streak = currentStreak(sessions);
  const next = nextAchievement(sessions);
  const stage = treeStage(sessions);
  const art = w * Math.max(0.68, 1.05 - stage * 0.05); // small plants larger; grown crowns smaller so they clear the text
  const ground = treeGround(stage);
  const pad = space[5]; // ground edge sits as far from the right and bottom as the text from the top and left
  return (
    <View style={styles.tiles}>
      <Tile label={t('home.streak', { count: streak })} onWidth={setW} style={styles.streakCard}>
        <View aria-hidden style={[styles.tileArt, { right: pad - art * (1 - ground.right), bottom: pad - art * (1 - ground.bottom) }]}>
          <Tree stage={stage} size={art} />
        </View>
        <Txt variant="display" style={{ fontSize: w * 0.3, lineHeight: w * 0.32 }}>
          {streak}
        </Txt>
        <Txt variant="caption" style={{ fontSize: 15 }}>
          {t('home.daysInRow', { count: streak })}
        </Txt>
      </Tile>
      {next && (
        <Tile label={`${t('home.cards.milestone')}: ${t(`achievements.${next.a.id}.title`)}`} style={styles.milestoneCard} onPress={toStages}>
          <Badge a={next.a} earned={false} size={w * 0.3} />
          <Txt variant="label">
            {t('home.cards.milestone')}
          </Txt>
          <Txt variant="title" numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 21, lineHeight: 26 }}>
            {t(`achievements.${next.a.id}.title`)}
          </Txt>
          <View style={[styles.bar, styles.barTrack, { backgroundColor: c.divider }]}>
            <View style={[styles.bar, { width: `${(next.value / next.a.target) * 100}%`, backgroundColor: c.accent }]} />
          </View>
          <Txt variant="caption" style={{ fontSize: 15 }}>
            {t('achievements.progress', { value: next.value, target: next.a.target })}
          </Txt>
        </Tile>
      )}
    </View>
  );
}

function Tile({
  label,
  onWidth,
  onPress = toProgress,
  style,
  children,
}: {
  label: string;
  onWidth?: (w: number) => void;
  onPress?: () => void;
  style?: ViewStyle;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      onLayout={onWidth && ((e) => onWidth(e.nativeEvent.layout.width))}
      style={styles.tile}>
      <Card style={{ ...styles.tileCard, ...style }}>{children}</Card>
    </Pressable>
  );
}

function Week() {
  const { t } = useTranslation();
  const week = lastDays(useStore((s) => s.sessions));
  const total = Math.round(week.reduce((sum, d) => sum + d.minutes, 0));
  return (
    <Pressable accessibilityRole="link" onPress={toProgress}>
      <Card>
        <Txt variant="label">{t('progress.week')}</Txt>
        <DayBars data={week} labels height={48} label={`${t('progress.week')}: ${t('home.weekTotal', { count: total })}`} />
        <Txt variant="caption">{t('home.weekTotal', { count: total })}</Txt>
      </Card>
    </Pressable>
  );
}

/** Show, hide and reorder the Home cards. */
// ponytail: arrows instead of drag-and-drop; add drag if people ask
function Customize({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const home = useHome();
  const setSettings = useStore((s) => s.setSettings);
  const order = [...home, ...DEFAULT_HOME.filter((id) => !home.includes(id))]; // shown first, then hidden
  const save = (next: HomeCard[]) => setSettings({ home: next });
  const move = (id: HomeCard, by: number) => {
    const i = home.indexOf(id);
    const j = i + by;
    if (j < 0 || j >= home.length) return;
    const next = [...home];
    [next[i], next[j]] = [next[j], next[i]];
    save(next);
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Txt variant="title">{t('home.customize')}</Txt>
      {order.map((id) => {
        const on = home.includes(id);
        return (
          <View key={id} style={styles.customRow}>
            <Txt variant="body" style={{ flex: 1, opacity: on ? 1 : 0.5 }}>
              {t(`home.cards.${id}`)}
            </Txt>
            {on && <Step icon="arrow-up" label={t('home.moveUp')} onPress={() => move(id, -1)} />}
            {on && <Step icon="arrow-down" label={t('home.moveDown')} onPress={() => move(id, 1)} />}
            <Step
              icon={on ? 'eye' : 'eye-off'}
              label={t(on ? 'home.hide' : 'home.show')}
              onPress={() => save(on ? home.filter((x) => x !== id) : [...home, id])}
            />
          </View>
        );
      })}
      <Button label={t('home.done')} onPress={onClose} style={styles.wide} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  customize: { alignSelf: 'flex-end', marginBottom: -space[3] },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: space[1], marginVertical: space[1] },
  dot: { width: 10, height: 10, borderRadius: radius.pill },
  row: { flexDirection: 'row', gap: space[3], marginTop: space[2] },
  half: { flex: 1, alignItems: 'center', paddingHorizontal: space[2] },
  wide: { alignSelf: 'stretch', alignItems: 'center', marginTop: space[2] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  tiles: { flexDirection: 'row', gap: space[3] },
  tile: { flex: 1 },
  tileCard: { aspectRatio: 1, alignItems: 'center', justifyContent: 'center', gap: 0, padding: space[3], overflow: 'hidden' },
  streakCard: { alignItems: 'flex-start', justifyContent: 'flex-start', padding: space[5] },
  milestoneCard: { gap: space[1] },
  tileArt: { position: 'absolute' }, // bottom-right, so a grown crown clears the text
  bar: { height: 6, borderRadius: radius.pill },
  barTrack: { alignSelf: 'stretch', marginTop: space[1] },
  corner: { position: 'absolute', top: space[3], right: space[3], zIndex: 1 },
  cornerPad: { paddingRight: space[8] },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
});
