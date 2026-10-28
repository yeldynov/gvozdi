// Google via Clerk SSO: an in-app browser returns to gvozdi://sso-callback (allowlisted in Clerk); the hook activates the session.
import { useSSO } from '@clerk/expo/experimental';

export function useGoogleSignIn() {
  const { startSSOFlow } = useSSO();
  return async () => (await startSSOFlow({ strategy: 'oauth_google' })).authSessionResult?.type === 'success';
}
