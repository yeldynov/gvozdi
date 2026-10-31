// Contact form: email + message, sent through EmailJS (REST, no SDK). Open to guests.
import { useUser } from '@clerk/expo';
import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, TextInput } from 'react-native';

import { BackHeader, Button, Card, Screen, Txt } from '@/components/ui';
import { fonts, radius, space, useColors } from '@/theme';

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
    </Screen>
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
