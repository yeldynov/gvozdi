import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextProps, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { Scene, SCENES, type SceneName } from '@/components/scenes';
import { fonts, radius, space, useColors } from '@/theme';

// Character scenes exported as static SVGs from the gvozdi-pwa design set (onboarding scenes).
const ART = {
  stand: require('@/assets/art/stand.svg'),
  reflect: require('@/assets/art/reflect.svg'),
  walk: require('@/assets/art/walk.svg'),
  rest: require('@/assets/art/rest.svg'),
  together: require('@/assets/art/together.svg'),
};
export type ArtName = keyof typeof ART | SceneName;

/** Decorative square illustration that breathes (rises and swells) and sways on a slower beat; still on reduced motion. */
export function Art({ name, size = 220 }: { name: ArtName; size?: number }) {
  const reduced = useReducedMotion();
  const breath = useSharedValue(0);
  const sway = useSharedValue(-1);
  useEffect(() => {
    if (reduced) return;
    const ease = Easing.inOut(Easing.sin);
    breath.value = withRepeat(withTiming(1, { duration: 3500, easing: ease }), -1, true);
    sway.value = withRepeat(withTiming(1, { duration: 6000, easing: ease }), -1, true);
    return () => {
      cancelAnimation(breath);
      cancelAnimation(sway);
    };
  }, [reduced, breath, sway]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -size * 0.03 * breath.value },
      { scale: 1 + 0.05 * breath.value },
      { rotate: reduced ? '0deg' : `${1.5 * sway.value}deg` },
    ],
  }));
  return (
    <Animated.View style={[{ alignSelf: 'center' }, style]}>
      {name in SCENES ? (
        <Scene name={name as SceneName} size={size} />
      ) : (
        <Image source={ART[name as keyof typeof ART]} contentFit="contain" accessible={false} style={{ width: size, height: size }} />
      )}
    </Animated.View>
  );
}

/** Brand lockup from gvozdi-pwa: ring + center nail, lowercase wordmark (always Fraunces, the name is Latin). */
export function Logo() {
  const c = useColors();
  return (
    <View accessibilityRole="header" accessibilityLabel="gvozdi" style={styles.logo}>
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Circle cx={12} cy={12} r={10} fill="none" stroke={c.text} strokeWidth={1.2} />
        <Circle cx={12} cy={12} r={1.8} fill={c.text} />
      </Svg>
      <Text style={[styles.logoText, { color: c.text }]}>gvozdi</Text>
    </View>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  const c = useColors();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Web: a classic scrollbar takes width, pushing the column off-centre from the tab bar. */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={Platform.OS !== 'web'}>
        {children}
      </ScrollView>
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
  return <Text accessibilityRole={variant === 'display' ? 'header' : undefined} {...props} style={[styles[variant], { color }, cyrillic && { fontFamily: fonts.displayCyrillic }, style]} />;
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
  icon,
}: {
  label: string;
  onPress: () => void;
  ghost?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
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
      <View style={styles.buttonRow}>
        {icon}
        <Text style={[styles.buttonText, { color: ghost ? c.text : c.onPrimary }]}>{label}</Text>
      </View>
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
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} />
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
            aria-checked={selected}
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
  logo: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  logoText: { fontFamily: fonts.display, fontSize: 22, letterSpacing: 0.4 },
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
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  choice: { flexDirection: 'row', borderRadius: radius.pill, padding: 3 },
  choiceItem: { flex: 1, alignItems: 'center', paddingVertical: space[2], borderRadius: radius.pill },
  stepBtn: { width: 36, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  choiceText: { fontFamily: fonts.textMedium, fontSize: 14 },
});
