// Contact form: email + message, sent through EmailJS (REST, no SDK). Open to guests.
import { useUser } from '@clerk/expo';
import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, StyleSheet, TextInput } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BackHeader, Button, Card, Screen, Txt } from '@/components/ui';
import { fonts, radius, space, useColors } from '@/theme';

const TELEGRAM_URL = 'https://t.me/gvozdi_support_bot';

// EmailJS keys are public by design (they ship to the browser). Native needs "Allow EmailJS API for non-browser applications" in the EmailJS dashboard.
const EMAILJS = {
  service_id: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID,
  template_id: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID,
  user_id: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY,
};

export default function Contact() {
  const { t, i18n } = useTranslation();
  const c = useColors();
  const { user } = useUser();
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress ?? '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...EMAILJS,
          template_params: {
            site: 'Gvozdi',
            email: email.trim(),
            message: message.trim(),
            app: `${Platform.OS} ${Constants.expoConfig?.version ?? ''} ${i18n.language}`,
          },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSent(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const input = [styles.input, { color: c.text, backgroundColor: c.surface, borderColor: c.divider }];

  return (
    <Screen>
      <BackHeader title={t('common.back')} fallback="/settings" />
      <Txt variant="display">{t('contact.title')}</Txt>
      <Card>
        {sent ? (
          <Txt style={{ color: c.success }}>{t('contact.sent')}</Txt>
        ) : (
          <>
            <Txt style={{ color: c.text2 }}>{t('contact.intro')}</Txt>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('account.emailPlaceholder')}
              placeholderTextColor={c.text3}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              aria-label={t('contact.email')}
              style={input}
            />
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={t('contact.messagePlaceholder')}
              placeholderTextColor={c.text3}
              multiline
              maxLength={4000}
              aria-label={t('contact.message')}
              style={[input, styles.message]}
            />
            {error && <Txt style={{ color: c.error }}>{t('contact.failed')}</Txt>}
            <Button
              label={busy ? '…' : t('contact.send')}
              onPress={send}
              disabled={busy || !email.includes('@') || !message.trim()}
              style={styles.full}
            />
          </>
        )}
      </Card>
      <Button
        ghost
        color={c.info}
        icon={<TelegramMark color={c.info} />}
        label={t('contact.telegram')}
        onPress={() => Linking.openURL(TELEGRAM_URL)}
        style={styles.full}
      />
    </Screen>
  );
}

// Telegram's mark (simple-icons), drawn in the button's color.
function TelegramMark({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
      <Path
        fill={color}
        d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  input: {
    fontFamily: fonts.text,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    marginTop: space[2],
  },
  message: { minHeight: 160, textAlignVertical: 'top' },
  full: { alignSelf: 'stretch', alignItems: 'center', marginTop: space[2] },
});
