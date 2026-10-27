import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type TextProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fonts, radius, space, useColors } from '@/theme';

export function Screen({ children }: { children: ReactNode }) {
  const c = useColors();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={styles.scroll}>{children}</ScrollView>
    </SafeAreaView>
  );
}

type Variant = 'display' | 'title' | 'body' | 'label' | 'caption';

export function Txt({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  const c = useColors();
  const color = variant === 'label' || variant === 'caption' ? c.text2 : c.text;
  return <Text {...props} style={[styles[variant], { color }, style]} />;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const c = useColors();
  return <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.divider }, style]}>{children}</View>;
}

export function Button({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}>
      <Text style={[styles.buttonText, { color: c.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}

/** Segmented single choice. */
export function Choice<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const c = useColors();
  return (
    <View style={[styles.choice, { backgroundColor: c.bg2 }]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.choiceItem, selected && { backgroundColor: c.primary }]}>
            <Text style={[styles.choiceText, { color: selected ? c.onPrimary : c.text2 }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space[5], gap: space[4], width: '100%', maxWidth: 560, alignSelf: 'center' },
  display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30 },
  body: { fontFamily: fonts.text, fontSize: 16, lineHeight: 22 },
  label: { fontFamily: fonts.textMedium, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase' },
  caption: { fontFamily: fonts.text, fontSize: 13 },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space[5], gap: space[2] },
  button: { borderRadius: radius.pill, paddingVertical: space[3], paddingHorizontal: space[6], alignSelf: 'flex-start' },
  buttonText: { fontFamily: fonts.textBold, fontSize: 16 },
  choice: { flexDirection: 'row', borderRadius: radius.pill, padding: 3 },
  choiceItem: { flex: 1, alignItems: 'center', paddingVertical: space[2], borderRadius: radius.pill },
  choiceText: { fontFamily: fonts.textMedium, fontSize: 14 },
});
