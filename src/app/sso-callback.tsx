// Google sign-in lands here. Web: Clerk completes the sign-in from the URL and navigates on. Native: the auth
// session already caught the redirect, but the deep link can still open this route, so just move on.
import { useClerk } from '@clerk/expo';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function SSOCallback() {
  const clerk = useClerk();
  useEffect(() => {
    if (Platform.OS === 'web') clerk.handleRedirectCallback({ signInFallbackRedirectUrl: '/', signUpFallbackRedirectUrl: '/' });
  }, [clerk]);
  return Platform.OS === 'web' ? null : <Redirect href="/" />;
}
