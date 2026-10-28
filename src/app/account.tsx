// One passwordless screen: email → code. Signs in if the email is known, otherwise signs up.
import { useAuth, useSignIn, useSignUp, useUser } from '@clerk/expo';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BackHeader, Button, Card, Screen, Txt } from '@/components/ui';
import { capture } from '@/lib/analytics';
import { useGoogleSignIn } from '@/lib/google-sign-in';
import { syncNow } from '@/lib/sync';
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
  const { isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const googleSignIn = useGoogleSignIn();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [flow, setFlow] = useState<'in' | 'up'>(); // set once a code is on its way
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false); // just signed in here: go Home once the auth guard lets us

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
      capture(flow === 'in' ? 'signed_in' : 'signed_up');
      setDone(true);
    });

  const google = () =>
    step(async () => {
      if (!(await googleSignIn())) return;
      capture('signed_in', { method: 'google' });
      setDone(true);
    });

  // The sessions live in the account, so the device forgets them; otherwise the next sign-in would merge them into another account.
  // If the last sync fails we stay signed in, so nothing unsynced is lost. This screen is open to guests, so leave for onboarding explicitly.
  const onSignOut = () =>
    step(async () => {
      if (!(await syncNow(getToken))) return setError(t('account.signOutFailed'));
      await signOut();
      const st = useStore.getState();
      st.setSyncCursor(undefined);
      st.replaceSessions([]);
      router.replace('/onboarding');
    });

  if (done && isSignedIn) return <Redirect href="/" />;

  const input = [styles.input, { color: c.text, backgroundColor: c.surface, borderColor: c.divider }];

  return (
    <Screen>
      {isSignedIn ? <BackHeader title={t('tabs.settings')} fallback="/settings" /> : <BackHeader title={t('common.back')} fallback="/onboarding" />}
      <Txt variant="display">{t('account.title')}</Txt>

      {isSignedIn ? (
        <Card>
          <Txt variant="label">{t('account.signedInAs')}</Txt>
          <Txt variant="title">{user?.primaryEmailAddress?.emailAddress}</Txt>
          <Txt variant="caption">{t('account.syncedText')}</Txt>
          {error && <Txt style={{ color: c.error }}>{error}</Txt>}
          <Button ghost label={busy ? '…' : t('account.signOut')} onPress={onSignOut} disabled={busy} style={styles.full} />
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
          {!flow && <Button ghost label={t('account.google')} icon={<GoogleMark />} onPress={google} disabled={busy} style={styles.full} />}
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

// Google's "G" keeps its brand colors in both themes, per Google's sign-in branding rules.
function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48" aria-hidden>
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
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
  code: { fontSize: 24, letterSpacing: 8, textAlign: 'center', fontVariant: ['tabular-nums'] },
  full: { alignSelf: 'stretch', alignItems: 'center', marginTop: space[2] },
});
