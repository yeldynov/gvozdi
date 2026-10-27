import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import type { Achievement } from '@/lib/practice';
import { fonts, radius, space, useColors } from '@/theme';

const ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  first_session: 'check',
  streak_3: 'sunrise',
  streak_7: 'sun',
  sessions_10: 'layers',
  streak_14: 'trending-up',
  streak_30: 'shield',
  streak_60: 'award',
  streak_100: 'star',
  streak_365: 'globe',
};

/** Round badge; muted until earned. */
export function Badge({ a, earned, size = 56 }: { a: Achievement; earned: boolean; size?: number }) {
  const c = useColors();
  const color = earned ? (a.kind === 'count' ? c.success : c.accent) : c.text3;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        borderColor: earned ? color : c.divider,
        backgroundColor: c.surface,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: earned ? 1 : 0.55,
      }}>
      <Feather name={ICONS[a.id] ?? 'star'} size={size * 0.4} color={color} />
    </View>
  );
}

/** Minutes per day as bars, today highlighted; weekday letters under each bar when `labels`. */
export function DayBars({
  data,
  label,
  height = 72,
  labels,
}: {
  data: { day: string; minutes: number }[];
  label: string;
  height?: number;
  labels?: boolean;
}) {
  const c = useColors();
  const { i18n } = useTranslation();
  const max = Math.max(10, ...data.map((d) => d.minutes));
  return (
    <View accessible accessibilityLabel={label} style={[styles.row, { gap: data.length > 10 ? 3 : space[2] }]}>
      {data.map((d, i) => {
        const [y, m, day] = d.day.split('-').map(Number);
        return (
          <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: space[1] }}>
            <View style={{ height, width: '100%', justifyContent: 'flex-end' }}>
              <View
                style={{
                  height: Math.max(3, (d.minutes / max) * height),
                  borderRadius: 3,
                  backgroundColor: !d.minutes ? c.text3 : i === data.length - 1 ? c.accent : c.primary,
                  opacity: d.minutes ? 1 : 0.25,
                }}
              />
            </View>
            {labels && (
              <Text style={[styles.day, { color: c.text3 }]}>
                {new Date(y, m - 1, day).toLocaleDateString(i18n.language, { weekday: 'narrow' })}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  day: { fontFamily: fonts.textMedium, fontSize: 11 },
});
