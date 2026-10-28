import Feather from '@expo/vector-icons/Feather';
import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import type { GuidePicName } from '@/components/guide-pics';
import { Button, Logo, Sheet, Txt, type ArtName } from '@/components/ui';
import { radius, space, useColors } from '@/theme';

export const SUPPORT_URL = 'https://t.me/gvozdi_support_bot';
const openSupport = () => Linking.openURL(SUPPORT_URL);

// Telegram's mark (simple-icons), drawn in the button's color.
function TelegramMark({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
      />
    </Svg>
  );
}

/** The "write to us" button: Telegram blue-ish, with its mark. */
export function WriteToUs({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useTranslation();
  const c = useColors();
  return <Button ghost color={c.info} icon={<TelegramMark color={c.info} />} label={t('settings.write')} onPress={openSupport} style={style} />;
}

/** Reading pages (`read.<id>` in i18n); journal articles are listed on /journal in this order. */
// `pics`: a guide vignette per paragraph, by section; `accordion`: sections fold under their heading.
export const PAGES: Record<string, { art: ArtName; article?: boolean; accordion?: boolean; pics?: GuidePicName[][] }> = {
  guide: { art: 'stand', pics: [['mat', 'support', 'wound'], ['stepOn', 'knees'], ['gaze', 'wave', 'timer'], ['warm', 'dots']] },
  faq: { art: 'reflect', accordion: true },
  about: { art: 'together' },
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
  const items: { icon: keyof typeof Feather.glyphMap | 'telegram'; label: string; onPress: () => void; color?: string }[] = [
    { icon: 'book-open', label: t('menu.guide'), onPress: () => go('/read/guide') },
    { icon: 'feather', label: t('menu.journal'), onPress: () => go('/journal') },
    { icon: 'help-circle', label: t('menu.faq'), onPress: () => go('/read/faq') },
    { icon: 'info', label: t('menu.about'), onPress: () => go('/read/about') },
    { icon: 'telegram', label: t('settings.contact'), onPress: openSupport, color: c.info },
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
              {item.icon === 'telegram' ? <TelegramMark color={c.info} size={20} /> : <Feather name={item.icon} size={20} color={c.text2} />}
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
