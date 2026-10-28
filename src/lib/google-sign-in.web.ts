// Web: full-page redirect to Google; /sso-callback finishes the sign-in (or sign-up) and lands on Home.
import { useSignIn } from '@clerk/expo';

export function useGoogleSignIn() {
  const { signIn } = useSignIn();
  return async () => {
    const { error } = await signIn.sso({
      strategy: 'oauth_google',
      redirectUrl: `${location.origin}/`,
      redirectCallbackUrl: `${location.origin}/sso-callback`,
    });
    if (error) throw error;
    return false; // the page is navigating away
  };
}
