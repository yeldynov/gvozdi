import Feather from '@expo/vector-icons/Feather';
import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import type { GuidePicName } from '@/components/guide-pics';
import { Button, Logo, Sheet, Txt, type ArtName } from '@/components/ui';
import { radius, space, useColors } from '@/theme';

/** The "write to us" button: opens the contact form. */
export function WriteToUs({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useTranslation();
  const c = useColors();
  return <Button ghost color={c.info} icon={<Feather name="mail" size={18} color={c.info} />} label={t('settings.write')} onPress={() => router.push('/contact')} style={style} />;
}

/** Reading pages (`read.<id>` in i18n); journal articles are listed on /journal in this order. */
// `pics`: a guide vignette per paragraph, by section; `accordion`: sections fold under their heading.
export const PAGES: Record<string, { art: ArtName; article?: boolean; accordion?: boolean; pics?: GuidePicName[][] }> = {
  guide: { art: 'stand', pics: [['mat', 'support', 'wound'], ['stepOn', 'knees'], ['gaze', 'wave', 'timer'], ['warm', 'dots']] },
  faq: { art: 'reflect', accordion: true },
  about: { art: 'together' },
  program: { art: 'time' },
  'first-minutes': { art: 'feel', article: true },
  'why-feet': { art: 'step', article: true },
  habit: { art: 'time', article: true },
  after: { art: 'rest', article: true },
};
export const ARTICLES = Object.keys(PAGES).filter((id) => PAGES[id].article);

/** One section of a reading page: optional heading, then paragraphs. */
export type Section = { h?: string; p: string[] };
export type Page = { title: string; lead: string; sections: Section[] };

/** Top row of a tab: logo, then `children` spread across the row, burger menu at the end. */
export function TabHead({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <View style={styles.head}>
      <View style={styles.headContent}>
        <Pressable accessibilityRole="link" accessibilityLabel={t('tabs.home')} hitSlop={8} onPress={() => router.navigate('/')}>
          <Logo />
        </Pressable>
        {children}
      </View>
      <MenuButton />
    </View>
  );
}

function MenuButton() {
  const { t } = useTranslation();
  const c = useColors();
  const [open, setOpen] = useState(false);
  const go = (href: Href) => {
    setOpen(false);
    router.push(href);
  };
  const items: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; color?: string }[] = [
    { icon: 'book-open', label: t('menu.guide'), onPress: () => go('/read/guide') },
    { icon: 'calendar', label: t('menu.program'), onPress: () => go('/read/program') },
    { icon: 'feather', label: t('menu.journal'), onPress: () => go('/journal') },
    { icon: 'help-circle', label: t('menu.faq'), onPress: () => go('/read/faq') },
    { icon: 'info', label: t('menu.about'), onPress: () => go('/read/about') },
    { icon: 'mail', label: t('settings.contact'), onPress: () => go('/contact'), color: c.info },
  ];
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('menu.open')}
        hitSlop={8}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.burger, { backgroundColor: c.bg2, borderColor: c.divider, opacity: pressed ? 0.7 : 1 }]}>
        {/* Staggered lines, the short one ends in an accent dot (a nail head). */}
        <Svg width={22} height={22} viewBox="0 0 22 22">
          <Line x1={3} y1={6} x2={19} y2={6} stroke={c.text} strokeWidth={2} strokeLinecap="round" />
          <Line x1={3} y1={11} x2={12} y2={11} stroke={c.text} strokeWidth={2} strokeLinecap="round" />
          <Circle cx={17} cy={11} r={1.75} fill={c.accent} />
          <Line x1={3} y1={16} x2={15} y2={16} stroke={c.text} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)}>
        <Logo />
        <View>
          {items.map((item) => (
            <Pressable
              key={item.icon}
              accessibilityRole="link"
              onPress={item.onPress}
              style={({ pressed }) => [styles.item, { borderColor: c.divider, opacity: pressed ? 0.6 : 1 }]}>
              <Feather name={item.icon} size={20} color={item.color ?? c.text2} />
              <Txt style={{ flex: 1, color: item.color ?? c.text }}>{item.label}</Txt>
              <Feather name="chevron-right" size={18} color={c.text3} />
            </Pressable>
          ))}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  headContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3] },
  burger: { width: 44, height: 44, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: space[4], paddingVertical: space[4], borderBottomWidth: StyleSheet.hairlineWidth },
});
