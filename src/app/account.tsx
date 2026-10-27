// One passwordless screen: email → code. Signs in if the email is known, otherwise signs up.
import { useAuth, useSignIn, useSignUp, useUser } from '@clerk/expo';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';

import { BackHeader, Button, Card, Screen, Txt } from '@/components/ui';
import { useStore } from '@/store';
import { fonts, radius, space, useColors } from '@/theme';

type ClerkErr = { code?: string; errors?: { code?: string }[] } | null;
const codeOf = (e: ClerkErr) => e?.errors?.[0]?.code ?? e?.code;

const ERRORS: Record<string, string> = {
  form_identifier_invalid: 'account.badEmail',
  form_param_format_invalid: 'account.badEmail',
  form_code_incorrect: 'account.badCode',
  verification_expired: 'account.expired',
};

export default function Account() {
  const { t } = useTranslation();
  const c = useColors();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [flow, setFlow] = useState<'in' | 'up'>(); // set once a code is on its way
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const fail = (e: ClerkErr) => setError(t(ERRORS[codeOf(e) ?? ''] ?? 'account.failed'));

  const step = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(undefined);
    try {
      await fn();
    } catch {
      setError(t('account.failed'));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    step(async () => {
      const emailAddress = email.trim();
      const { error: inErr } = await signIn.emailCode.sendCode({ emailAddress });
      if (!inErr) return setFlow('in');
      if (codeOf(inErr) !== 'form_identifier_not_found') return fail(inErr);
      const { error: upErr } = await signUp.create({ emailAddress });
      if (upErr) return fail(upErr);
      const { error: sendErr } = await signUp.verifications.sendEmailCode();
      if (sendErr) return fail(sendErr);
      setFlow('up');
    });

  const verify = () =>
    step(async () => {
      const attempt = flow === 'in' ? signIn : signUp;
      const { error: e } =
        flow === 'in'
          ? await signIn.emailCode.verifyCode({ code: code.trim() })
          : await signUp.verifications.verifyEmailCode({ code: code.trim() });
      if (e) return fail(e);
      if (attempt.status !== 'complete') return setError(t('account.failed'));
      const { error: finErr } = await attempt.finalize();
      if (finErr) return fail(finErr);
      if (router.canGoBack()) router.back();
      else router.replace('/settings');
    });

  const onSignOut = async () => {
    await signOut();
    useStore.getState().setSyncCursor(undefined); // local sessions stay; the next account starts a fresh pull
  };

  const input = [styles.input, { color: c.text, backgroundColor: c.surface, borderColor: c.divider }];

  return (
    <Screen>
      <BackHeader title={t('tabs.settings')} fallback="/settings" />
      <Txt variant="display">{t('account.title')}</Txt>

      {isSignedIn ? (
        <Card>
          <Txt variant="label">{t('account.signedInAs')}</Txt>
          <Txt variant="title">{user?.primaryEmailAddress?.emailAddress}</Txt>
          <Txt variant="caption">{t('account.syncedText')}</Txt>
          <Button ghost label={t('account.signOut')} onPress={onSignOut} style={styles.full} />
        </Card>
      ) : (
        <Card>
          <Txt style={{ color: c.text2 }}>{flow ? t('account.codeSent', { email: email.trim() }) : t('account.intro')}</Txt>
          {flow ? (
            <TextInput
              key="code"
              value={code}
              onChangeText={setCode}
              placeholder={t('account.codePlaceholder')}
              placeholderTextColor={c.text3}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              autoFocus
              style={[input, styles.code]}
            />
          ) : (
            <TextInput
              key="email"
              value={email}
              onChangeText={setEmail}
              placeholder={t('account.emailPlaceholder')}
              placeholderTextColor={c.text3}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              onSubmitEditing={sendCode}
              style={input}
            />
          )}
          {error && <Txt style={{ color: c.error }}>{error}</Txt>}
          <Button
            label={busy ? '…' : flow ? t('account.verify') : t('account.continue')}
            onPress={flow ? verify : sendCode}
            disabled={busy || !(flow ? code.trim() : email.includes('@'))}
            style={styles.full}
          />
          {flow && (
            <Button
              ghost
              label={t('account.changeEmail')}
              onPress={() => {
                setFlow(undefined);
                setCode('');
                setError(undefined);
              }}
              style={styles.full}
            />
          )}
          {/* Clerk mounts its bot check here on web sign-ups. */}
          <View nativeID="clerk-captcha" />
        </Card>
      )}
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
  code: { fontSize: 24, letterSpacing: 8, textAlign: 'center', fontVariant: ['tabular-nums'] },
  full: { alignSelf: 'stretch', alignItems: 'center', marginTop: space[2] },
});
