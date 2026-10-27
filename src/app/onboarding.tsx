import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Art, Button, Txt, type ArtName } from '@/components/ui';
import { capture } from '@/lib/analytics';
import { useStore } from '@/store';
import { fonts, radius, space, useColors } from '@/theme';

const PAGES = ['welcome', 'peak', 'start'] as const;
const ART: Record<(typeof PAGES)[number], ArtName> = { welcome: 'step', peak: 'feel', start: 'time' };

export default function Onboarding() {
  const { t } = useTranslation();
  const c = useColors();
  const [page, setPage] = useState(0);
  const key = PAGES[page];
  const last = page === PAGES.length - 1;

  const finish = () => {
    useStore.getState().setSettings({ onboarded: true });
    capture('onboarding_completed', { skipped: !last });
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.top}>
        {!last && (
          <Pressable accessibilityRole="button" hitSlop={12} onPress={finish}>
            <Text style={[styles.skip, { color: c.text2 }]}>{t('onboarding.skip')}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.body}>
        <Art name={ART[key]} size={240} />
        <Txt variant="label">{t(`onboarding.${key}.kicker`)}</Txt>
        <Txt variant="display" style={styles.headline}>{t(`onboarding.${key}.title`)}</Txt>
        <Txt style={[styles.text, { color: c.text2 }]}>{t(`onboarding.${key}.text`)}</Txt>
        {last && <Txt variant="caption">{t('onboarding.start.safety')}</Txt>}
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {PAGES.map((p, i) => (
            <View key={p} style={[styles.dot, { backgroundColor: i === page ? c.primary : c.divider }]} />
          ))}
        </View>
        <Button
          label={last ? t('onboarding.begin') : t('onboarding.next')}
          onPress={last ? finish : () => setPage(page + 1)}
          style={styles.cta}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: space[7], width: '100%', maxWidth: 560, alignSelf: 'center' },
  top: { height: 24, alignItems: 'flex-end' },
  skip: { fontFamily: fonts.textMedium, fontSize: 15 },
  body: { flex: 1, justifyContent: 'center', gap: space[4] },
  headline: { fontSize: 46, lineHeight: 50 },
  text: { fontSize: 16, lineHeight: 24, maxWidth: 340 },
  footer: { gap: space[6] },
  dots: { flexDirection: 'row', gap: space[2], justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  cta: { alignSelf: 'stretch', alignItems: 'center' },
});
