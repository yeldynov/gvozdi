import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { BeginButton, ChangeButton, LeaveProgram, ProgramFinished, useToday } from '@/components/today';
import { Card, Txt } from '@/components/ui';
import { currentStreak, lastDays, nextAchievement, PROGRAM, treeStage } from '@/lib/practice';
import { Tree } from '@/skins/herbarium/progress-visuals';
import { useStore } from '@/store';
import { herbFonts as fonts, radius, space, useColors } from '@/theme';

// Herbarium Home cards; the Home screen itself (invite, consent, Customize) is shared in src/app/(tabs)/index.tsx.

export function Today() {
  const { t } = useTranslation();
  const c = useColors();
  const { program, practised, done, min } = useToday();
  return (
    <Card style={styles.today}>
      <View style={styles.corner}>
        <ChangeButton />
      </View>
      <View style={[styles.titleRow, styles.cornerPad]}>
        {practised && <Feather name="check-circle" size={24} color={c.primary} />}
        <Txt variant="display" style={styles.todayTitle}>
          {practised ? t('home.doneToday', { count: done }) : min !== undefined ? t('home.suggested', { count: min }) : t('home.today')}
        </Txt>
      </View>
      {program?.finished ? (
        <ProgramFinished />
      ) : (
        program && (
          <>
            <Txt variant="caption">{t('home.programDay', { day: program.day, total: PROGRAM.length })}</Txt>
            <View style={styles.dashes} accessibilityLabel={t('home.programDone', { done: program.done, total: PROGRAM.length })}>
              {PROGRAM.map((_, i) => (
                <View key={i} style={[styles.dash, { backgroundColor: i < program.done ? c.primary : c.divider }]} />
              ))}
            </View>
          </>
        )
      )}
      <BeginButton />
      <LeaveProgram />
    </Card>
  );
}

const toProgress = () => router.navigate('/progress');

/** The specimen sheet: the tree grown from your sessions and the streak. Opens Progress. */
export function Stats() {
  const { t } = useTranslation();
  const c = useColors();
  const sessions = useStore((s) => s.sessions);
  const [w, setW] = useState(0); // sheet width: the tree scales with it
  const streak = currentStreak(sessions);
  const next = nextAchievement(sessions);
  const stage = treeStage(sessions);
  const art = w * 0.8;
  const label = [
    streak ? t('home.streak', { count: streak }) : t('home.noStreak'),
    next && `${t('home.cards.milestone')}: ${t(`achievements.${next.a.id}.title`)}, ${t('achievements.progress', { value: next.value, target: next.a.target })}`,
  ]
    .filter(Boolean)
    .join('. ');
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={toProgress}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Card style={styles.specimen}>
        <View aria-hidden style={[styles.plant, { width: art, height: art, left: w * 0.6 - art / 2, bottom: -art * 0.06 }]}>
          {w > 0 && <Tree stage={stage} size={art} />}
        </View>
        {streak > 0 ? (
          <>
            <Txt variant="display" style={styles.streak}>
              {streak}
            </Txt>
            <Txt variant="body" style={{ color: c.text2 }}>
              {t('home.daysInRow', { count: streak })}
            </Txt>
          </>
        ) : (
          <Txt variant="title" style={styles.noStreak}>
            {t('home.noStreak')}
          </Txt>
        )}
      </Card>
    </Pressable>
  );
}

/** Seven leaves, oldest first: filled on days you practised, an outline on rest days. */
export function Week() {
  const { t, i18n } = useTranslation();
  const c = useColors();
  const week = lastDays(useStore((s) => s.sessions));
  const total = Math.round(week.reduce((sum, d) => sum + d.minutes, 0));
  const days = week
    .filter((d) => d.minutes > 0)
    .map((d) => new Date(`${d.day}T12:00`).toLocaleDateString(i18n.language, { weekday: 'short' }))
    .join(', ');
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={[t('home.weekTotal', { count: total }), days].filter(Boolean).join('. ')} onPress={toProgress}>
      <Card style={styles.week}>
        <Txt variant="body" style={styles.weekText}>
          {t('home.weekTotal', { count: total })}
        </Txt>
        <View aria-hidden style={styles.leaves}>
          {week.map((d) => (
            <View key={d.day} style={[styles.leaf, { borderColor: c.primary }, d.minutes > 0 && { backgroundColor: c.primary }]} />
          ))}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  today: { gap: space[3] },
  todayTitle: { fontSize: 30, lineHeight: 36, flexShrink: 1 },
  dashes: { flexDirection: 'row', gap: 3 },
  dash: { flex: 1, height: 5, borderRadius: radius.pill },
  specimen: { aspectRatio: 1.2, gap: 0, overflow: 'hidden' },
  plant: { position: 'absolute' },
  streak: { fontSize: 64, lineHeight: 68, letterSpacing: -1.5 },
  noStreak: { maxWidth: '60%' },
  week: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space[4] },
  weekText: { fontFamily: fonts.textMedium, flexShrink: 1 },
  leaves: { flexDirection: 'row', gap: space[2] },
  leaf: { width: 14, height: 20, borderWidth: 1.5, borderTopLeftRadius: 14, borderBottomRightRadius: 14 },
  corner: { position: 'absolute', top: space[3], right: space[3], zIndex: 1 },
  cornerPad: { paddingRight: space[8] },
});
