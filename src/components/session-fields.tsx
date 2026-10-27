import Feather from '@expo/vector-icons/Feather';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { dayKey } from '@/lib/practice';
import type { Tension } from '@/lib/types';
import { fonts, radius, space, useColors } from '@/theme';

export const TENSION_ICONS: Record<Tension, keyof typeof Feather.glyphMap> = {
  intense: 'zap',
  tense: 'activity',
  mild: 'moon',
  easy: 'feather',
};

/** 'Today', 'Yesterday', or a localized weekday + date for a 'YYYY-MM-DD' key. */
export function useFormatDay() {
  const { t, i18n } = useTranslation();
  return (day: string) => {
    const now = new Date();
    if (day === dayKey(now)) return t('history.today');
    if (day === dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return t('history.yesterday');
    const [y, m, d] = day.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(i18n.language, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: y === now.getFullYear() ? undefined : 'numeric',
    });
  };
}

/** Four tiles; tapping the selected one clears it. */
export function TensionPicker({ value, onChange }: { value?: Tension; onChange: (t: Tension | undefined) => void }) {
  const { t } = useTranslation();
  const c = useColors();
  return (
    <View style={{ gap: space[3] }}>
      <Text style={[styles.label, { color: c.text2 }]}>{t('session.howIntense')}</Text>
      <View style={styles.row} accessibilityRole="radiogroup">
        {(Object.keys(TENSION_ICONS) as Tension[]).map((key) => {
          const on = value === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="radio"
              aria-checked={on}
              onPress={() => onChange(on ? undefined : key)}
              style={[styles.tile, { backgroundColor: on ? c.primary : c.bg2 }]}>
              <Feather name={TENSION_ICONS[key]} size={18} color={on ? c.onPrimary : c.text2} />
              <Text numberOfLines={1} style={[styles.tileText, { color: on ? c.onPrimary : c.text2 }]}>
                {t(`session.tension.${key}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function NoteInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  const c = useColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={t('session.notePlaceholder')}
      placeholderTextColor={c.text3}
      maxLength={280}
      multiline
      style={[styles.note, { color: c.text, backgroundColor: c.surface, borderColor: c.divider }]}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[2] },
  label: { fontFamily: fonts.textMedium, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase' },
  tile: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: space[3], borderRadius: radius.sm },
  tileText: { fontFamily: fonts.textMedium, fontSize: 11 },
  note: {
    minHeight: 64,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    padding: space[3],
    fontFamily: fonts.text,
    fontSize: 15,
    textAlignVertical: 'top',
  },
});
