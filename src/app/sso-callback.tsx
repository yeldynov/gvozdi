// Google sign-in lands here. Web: Clerk completes the sign-in from the URL. Native: the auth session already caught
// the redirect, but the deep link opens this route too. Either way, wait here until the session is active: leaving
// early hits the signed-out guard and flashes onboarding.
import { useAuth, useClerk } from '@clerk/expo';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, View } from 'react-native';

import { Art, Txt } from '@/components/ui';
import { space, useColors } from '@/theme';

export default function SSOCallback() {
  const clerk = useClerk();
  const { isSignedIn } = useAuth();
  const c = useColors();
  const { t } = useTranslation();
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') clerk.handleRedirectCallback({ signInFallbackRedirectUrl: '/', signUpFallbackRedirectUrl: '/' });
    const id = setTimeout(() => setStuck(true), 15000); // sign-in failed: back to the account screen
    return () => clearTimeout(id);
  }, [clerk]);

  if (isSignedIn) return <Redirect href="/" />;
  if (stuck) return <Redirect href="/account" />;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[5], backgroundColor: c.bg }}>
      <Art name="breathe" size={220} />
      <Txt variant="title">{t('account.signingIn')}</Txt>
      <ActivityIndicator color={c.primary} />
    </View>
  );
}
