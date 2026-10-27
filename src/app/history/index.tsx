import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { TENSION_ICONS, useFormatDay } from '@/components/session-fields';
import { BackHeader, Button, Card, Screen, Txt } from '@/components/ui';
import { formatDuration, groupByDay } from '@/lib/practice';
import { useStore } from '@/store';
import { fonts, space, useColors } from '@/theme';

// ponytail: plain ScrollView renders every row; switch to SectionList if histories reach the thousands
export default function History() {
  const { t, i18n } = useTranslation();
  const c = useColors();
  const sessions = useStore((s) => s.sessions);
  const formatDay = useFormatDay();
  const days = groupByDay(sessions);

  return (
    <Screen>
      <BackHeader title={t('tabs.progress')} fallback="/progress" />
      <Txt variant="display">{t('history.title')}</Txt>

      {days.length === 0 && (
        <Card>
          <Txt variant="title">{t('history.empty')}</Txt>
          <Txt variant="caption">{t('history.emptyText')}</Txt>
          <Button label={t('home.begin')} onPress={() => router.navigate('/practice')} style={{ marginTop: space[2] }} />
        </Card>
      )}

      {days.map(({ day, sessions: list, totalSec }) => (
        <View key={day} style={{ gap: space[2] }}>
          <View style={styles.row}>
            <Txt variant="label" style={{ flex: 1 }}>
              {formatDay(day)}
            </Txt>
            <Txt variant="caption">{formatDuration(totalSec)}</Txt>
          </View>
          <Card style={{ padding: 0, gap: 0 }}>
            {list.map((s, i) => (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/history/[id]', params: { id: s.id } })}
                style={({ pressed }) => [
                  styles.item,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.divider },
                  pressed && { backgroundColor: c.bg2 },
                ]}>
                <Txt style={[styles.duration, { color: c.text }]}>{formatDuration(s.durationSec)}</Txt>
                <View style={{ flex: 1 }}>
                  <Txt variant="caption">
                    {new Date(s.startedAt).toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit' })} ·{' '}
                    {t(`practice.modes.${s.mode}`)}
                  </Txt>
                  {s.note && (
                    <Txt numberOfLines={1} style={{ color: c.text }}>
                      {s.note}
                    </Txt>
                  )}
                </View>
                {s.tension && <Feather name={TENSION_ICONS[s.tension]} size={16} color={c.text3} />}
                <Feather name="chevron-right" size={18} color={c.text3} />
              </Pressable>
            ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[3], paddingHorizontal: space[4] },
  duration: { fontFamily: fonts.textMedium, fontSize: 18, minWidth: 64, fontVariant: ['tabular-nums'] },
});
