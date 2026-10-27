import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Badge, DayBars } from '@/components/progress-visuals';
import { Button, Card, Screen, Txt } from '@/components/ui';
import {
  ACHIEVEMENTS,
  bestStreak,
  currentStreak,
  earnedAchievementIds,
  formatDuration,
  lastDays,
  levelOf,
  totals,
} from '@/lib/practice';
import { useStore } from '@/store';
import { fonts, space, useColors } from '@/theme';

export default function Progress() {
  const { t } = useTranslation();
  const c = useColors();
  const sessions = useStore((s) => s.sessions);
  const sum = totals(sessions);
  const streak = currentStreak(sessions);
  const { level, next, totalMin, longestMin } = levelOf(sessions);
  const earned = earnedAchievementIds(sessions);
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
      <Txt variant="display">{t('progress.title')}</Txt>

      <Card style={{ gap: space[4] }}>
        <View>
          <Txt variant="label">{t('progress.streak')}</Txt>
          <View style={styles.baseline}>
            <Text style={[styles.big, { color: streak ? c.accent : c.text3 }]}>{streak}</Text>
            <Txt variant="caption">{t('progress.days', { count: streak })}</Txt>
          </View>
          <Txt variant="caption">{t('progress.best', { count: bestStreak(sessions) })}</Txt>
        </View>
        <DayBars data={week} labels label={`${t('progress.week')}: ${minutes(week)}`} />
      </Card>

      <Card>
        <Txt variant="label">{t('progress.level')}</Txt>
        <Txt variant="title">{t(`levels.${level.id}`)}</Txt>
        {next ? (
          <>
            <Txt variant="caption">{t('progress.nextLevel', { name: t(`levels.${next.id}`) })}</Txt>
            <Txt variant="caption">{t('progress.levelTotal', { value: Math.min(totalMin, next.totalMin), target: next.totalMin })}</Txt>
            <Txt variant="caption">
              {t('progress.levelLongest', { value: Math.min(longestMin, next.longestMin), target: next.longestMin })}
            </Txt>
          </>
        ) : (
          <Txt variant="caption">{t('progress.topLevel')}</Txt>
        )}
      </Card>

      <View style={styles.grid}>
        {stats.map(([label, value]) => (
          <Card key={label} style={styles.tile}>
            <Txt variant="caption">{label}</Txt>
            <Text style={[styles.value, { color: c.text }]}>{value}</Text>
          </Card>
        ))}
      </View>

      <Card style={{ gap: space[4] }}>
        <View style={[styles.baseline, { justifyContent: 'space-between' }]}>
          <Txt variant="label">{t('progress.month')}</Txt>
          <Txt variant="caption">{minutes(month)}</Txt>
        </View>
        <DayBars data={month} height={56} label={`${t('progress.month')}: ${minutes(month)}`} />
      </Card>

      <Txt variant="label">{t('progress.achievements')}</Txt>
      <View style={styles.grid}>
        {ACHIEVEMENTS.map((a) => (
          <Pressable
            key={a.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/achievement/[id]', params: { id: a.id } })}
            style={({ pressed }) => [styles.badge, { opacity: pressed ? 0.7 : 1 }]}>
            <Badge a={a} earned={earned.includes(a.id)} />
            <Txt variant="caption" numberOfLines={2} style={{ textAlign: 'center' }}>
              {t(`achievements.${a.id}.title`)}
            </Txt>
          </Pressable>
        ))}
      </View>

      <Button ghost label={t('history.link')} onPress={() => router.push('/history')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  baseline: { flexDirection: 'row', alignItems: 'baseline', gap: space[2] },
  big: { fontFamily: fonts.display, fontSize: 56, lineHeight: 64, fontVariant: ['tabular-nums'] },
  value: { fontFamily: fonts.textMedium, fontSize: 22, fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  tile: { flexBasis: '45%', flexGrow: 1, padding: space[4], gap: space[1] },
  badge: { width: '30%', flexGrow: 1, alignItems: 'center', gap: space[2], paddingVertical: space[2] },
});
