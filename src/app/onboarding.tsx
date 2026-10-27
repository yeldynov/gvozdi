import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Art, Button, Txt, type ArtName } from '@/components/ui';
import { capture } from '@/lib/analytics';
import { fonts, radius, space, useColors } from '@/theme';

const PAGES = ['welcome', 'peak', 'start'] as const;
const ART: Record<(typeof PAGES)[number], ArtName> = { welcome: 'step', peak: 'feel', start: 'time' };

export default function Onboarding() {
  const { t } = useTranslation();
  const c = useColors();
  const [page, setPage] = useState(0);
  const key = PAGES[page];
  const last = page === PAGES.length - 1;

  // Push, not replace: backing out of the account screen or the demo session returns here.
  const toAccount = () => {
    capture('onboarding_completed', { skipped: !last, account: true });
    router.push('/account');
  };
  const tryGuest = () => {
    capture('onboarding_completed', { skipped: !last, account: false });
    router.push({ pathname: '/session', params: { mode: 'free' } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Scrolls when the copy (longer in UK/RU) doesn't fit above the footer. */}
      <ScrollView contentContainerStyle={styles.root}>
        <View style={styles.top}>
          {!last && (
            <Pressable accessibilityRole="button" hitSlop={12} onPress={() => setPage(PAGES.length - 1)}>
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
            label={last ? t('onboarding.createAccount') : t('onboarding.next')}
            onPress={last ? toAccount : () => setPage(page + 1)}
            style={styles.cta}
          />
          <Button ghost label={t('onboarding.haveAccount')} onPress={toAccount} style={styles.cta} />
          {last && (
            <Pressable accessibilityRole="link" hitSlop={8} onPress={tryGuest} style={styles.guest}>
              <Text style={[styles.skip, { color: c.text2, textDecorationLine: 'underline' }]}>{t('onboarding.tryGuest')}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1, gap: space[6], padding: space[7], width: '100%', maxWidth: 560, alignSelf: 'center' },
  top: { height: 24, alignItems: 'flex-end' },
  skip: { fontFamily: fonts.textMedium, fontSize: 15 },
  body: { flexGrow: 1, justifyContent: 'center', gap: space[4] },
  headline: { fontSize: 46, lineHeight: 50 },
  text: { fontSize: 16, lineHeight: 24, maxWidth: 340 },
  footer: { gap: space[6] },
  dots: { flexDirection: 'row', gap: space[2], justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  cta: { alignSelf: 'stretch', alignItems: 'center' },
  guest: { alignSelf: 'center' },
});
