import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Meadow, Tree } from '@/skins/herbarium/progress-visuals';
import { TabHead } from '@/components/menu';
import { Button, Card, Screen, Txt } from '@/components/ui';
import {
  ACHIEVEMENTS,
  bestStreak,
  currentStreak,
  earnedAchievementIds,
  formatDuration,
  lastDays,
  nextAchievement,
  totals,
  treeStage,
} from '@/lib/practice';
import { useStore } from '@/store';
import { herbFonts as fonts, space, useColors } from '@/theme';

export default function Progress() {
  const { t } = useTranslation();
  const c = useColors();
  const sessions = useStore((s) => s.sessions);
  const { saved } = useLocalSearchParams<{ saved?: string }>();
  useEffect(() => {
    if (!saved) return;
    const id = setTimeout(() => router.setParams({ saved: undefined }), 4000);
    return () => clearTimeout(id);
  }, [saved]);
  const sum = totals(sessions);
  const streak = currentStreak(sessions);
  const week = lastDays(sessions);
  const month = lastDays(sessions, new Date(), 30);
  const minutes = (days: typeof week) =>
    t('progress.minutesTotal', { count: Math.round(days.reduce((n, d) => n + d.minutes, 0)) });
  const stats = [
    [t('progress.sessions'), String(sum.count)],
    [t('progress.total'), formatDuration(sum.totalSec)],
    [t('progress.average'), formatDuration(sum.avgSec)],
    [t('progress.longest'), formatDuration(sum.longestSec)],
  ];

  return (
    <Screen>
      <TabHead />
      {saved && (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space[3] }}>
          <Feather name="check-circle" size={20} color={c.success} />
          <Txt accessibilityLiveRegion="polite" role="status">{t('progress.saved')}</Txt>
        </Card>
      )}

      <Card style={{ gap: space[5] }}>
        <View>
          <Txt variant="display" style={[styles.streak, !streak && { color: c.text3 }]}>
            {streak}
          </Txt>
          <Txt variant="body" style={{ color: c.text2 }}>
            {t('home.daysInRow', { count: streak })}
          </Txt>
          <Txt variant="caption">{t('progress.best', { count: bestStreak(sessions) })}</Txt>
        </View>
        <View style={{ gap: space[3] }}>
          <Heading title={t('progress.week')} value={minutes(week)} />
          <Meadow data={week} labels label={`${t('progress.week')}: ${minutes(week)}`} />
        </View>
      </Card>

      <View style={styles.grid}>
        {stats.map(([label, value]) => (
          <Card key={label} style={styles.tile}>
            <Txt variant="caption">{label}</Txt>
            <Text style={[styles.value, { color: c.text }]}>{value}</Text>
          </Card>
        ))}
      </View>

      <Card style={{ gap: space[3] }}>
        <Heading title={t('progress.month')} value={minutes(month)} />
        <Meadow data={month} height={72} label={`${t('progress.month')}: ${minutes(month)}`} />
      </Card>

      <Plate />

      <Button ghost label={t('history.link')} onPress={() => router.push('/history')} />
    </Screen>
  );
}

function Heading({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.heading}>
      <Txt variant="body" style={styles.headingText}>
        {title}
      </Txt>
      <Txt variant="caption">{value}</Txt>
    </View>
  );
}

const CELL = 96; // one figure on the plate; every stage shares this scale

/** A botanical plate of the tree's life: every stage in a row on one soil line, ochre under what you have grown, faint ahead. */
function Plate() {
  const { t } = useTranslation();
  const c = useColors();
  const sessions = useStore((s) => s.sessions);
  const earned = earnedAchievementIds(sessions);
  const stage = treeStage(sessions);
  const top = ACHIEVEMENTS[stage - 2];
  const next = nextAchievement(sessions);
  const scroll = useRef<ScrollViewInstance>(null);
  const [w, setW] = useState(0);
  const grown = Math.max(0, stage - 1) * CELL; // soil under the earned stages
  useEffect(() => {
    // centre the newest growth
    if (w) scroll.current?.scrollTo({ x: Math.max(0, (stage - 2) * CELL - (w - CELL) / 2 + space[5]), animated: false });
  }, [w, stage]);

  return (
    <Card style={{ gap: space[2] }}>
      <Txt variant="title">{top ? t(`achievements.${top.id}.title`) : t('achievements.seed')}</Txt>
      <Txt variant="caption">{top ? t('progress.treeHint') : t('progress.treeEmpty')}</Txt>
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        style={styles.bleed}
        contentContainerStyle={styles.bleedIn}>
        <View>
          <View style={[styles.soil, { width: CELL * ACHIEVEMENTS.length, backgroundColor: c.divider }]} />
          <View style={[styles.soil, { width: grown, backgroundColor: c.illus }]} />
          <View style={{ flexDirection: 'row' }}>
            {ACHIEVEMENTS.map((a, i) => {
              const got = earned.includes(a.id);
              const title = t(`achievements.${a.id}.title`);
              const toward = next?.a.id === a.id ? t('achievements.progress', { value: next.value, target: a.target }) : null;
              return (
                <Pressable
                  key={a.id}
                  accessibilityRole="button"
                  accessibilityLabel={[title, got ? t('achievements.earned') : t('achievements.locked'), toward].filter(Boolean).join(', ')}
                  onPress={() => router.push({ pathname: '/achievement/[id]', params: { id: a.id } })}
                  style={({ pressed }) => [styles.figure, { opacity: pressed ? 0.7 : 1 }]}>
                  <View style={{ opacity: got ? 1 : 0.55 }}>
                    <Tree stage={i + 2} size={CELL} muted={!got} soil={false} />
                  </View>
                  <Txt variant="caption" numberOfLines={2} style={[styles.name, got && { color: c.text }]}>
                    {title}
                  </Txt>
                  {toward && <Txt variant="caption" style={styles.toward}>{toward}</Txt>}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  streak: { fontSize: 64, lineHeight: 68, letterSpacing: -1.5 },
  heading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space[2] },
  headingText: { fontFamily: fonts.textMedium, flexShrink: 1 },
  value: { fontFamily: fonts.textMedium, fontSize: 22, fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  tile: { flexBasis: '45%', flexGrow: 1, padding: space[4], gap: space[1] },
  bleed: { marginHorizontal: -space[5], marginTop: space[2] },
  bleedIn: { paddingHorizontal: space[5] },
  soil: { position: 'absolute', left: 0, top: CELL * 0.82 - 0.75, height: 1.5, borderRadius: 1 },
  figure: { width: CELL, alignItems: 'center', gap: space[1] },
  name: { textAlign: 'center', fontSize: 13, lineHeight: 17, paddingHorizontal: 2 },
  toward: { fontSize: 12, lineHeight: 16, fontVariant: ['tabular-nums'] },
});
