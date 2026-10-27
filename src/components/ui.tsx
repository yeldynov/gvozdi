import Feather from '@expo/vector-icons/Feather';
import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextProps, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, radius, space, useColors } from '@/theme';

export function Screen({ children }: { children: ReactNode }) {
  const c = useColors();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={styles.scroll}>{children}</ScrollView>
    </SafeAreaView>
  );
}

/** Back chevron + label for pushed screens; falls back to `fallback` when opened directly (web deep link). */
export function BackHeader({ title, fallback }: { title: string; fallback: Href }) {
  const c = useColors();
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      hitSlop={12}
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space[1], alignSelf: 'flex-start' }}>
      <Feather name="chevron-left" size={22} color={c.text2} />
      <Text style={[styles.label, { color: c.text2 }]}>{title}</Text>
    </Pressable>
  );
}

type Variant = 'display' | 'title' | 'body' | 'label' | 'caption';

export function Txt({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  const c = useColors();
  const { i18n } = useTranslation();
  const color = variant === 'label' || variant === 'caption' ? c.text2 : c.text;
  const cyrillic = (variant === 'display' || variant === 'title') && i18n.language !== 'en';
  return <Text {...props} style={[styles[variant], { color }, cyrillic && { fontFamily: fonts.displayCyrillic }, style]} />;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const c = useColors();
  return <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.divider }, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  ghost,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  ghost?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: ghost ? c.bg2 : c.primary, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}>
      <Text style={[styles.buttonText, { color: ghost ? c.text : c.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}

/** Bottom sheet over a dimmed backdrop; tapping the backdrop calls onClose. */
export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: ReactNode }) {
  const c = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('common.close')} />
        <View style={[styles.sheet, { backgroundColor: c.bg, paddingBottom: space[6] + insets.bottom }]}>{children}</View>
      </View>
    </Modal>
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

export function Step({ icon, label, onPress }: { icon: 'minus' | 'plus'; label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={[styles.stepBtn, { backgroundColor: c.bg2 }]}>
      <Feather name={icon} size={18} color={c.text} />
    </Pressable>
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
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: space[6],
    gap: space[5],
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  buttonText: { fontFamily: fonts.textBold, fontSize: 16 },
  choice: { flexDirection: 'row', borderRadius: radius.pill, padding: 3 },
  choiceItem: { flex: 1, alignItems: 'center', paddingVertical: space[2], borderRadius: radius.pill },
  stepBtn: { width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  choiceText: { fontFamily: fonts.textMedium, fontSize: 14 },
});
