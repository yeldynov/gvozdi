// Account card (Settings, /account): avatar + name when the provider gave them, email, sign out. Signed out: the SaveBanner.
import { useAuth, useUser } from '@clerk/expo';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Button, Card, Txt } from '@/components/ui';
import { syncNow } from '@/lib/sync';
import { useStore } from '@/store';
import { fonts, radius, space, useColors } from '@/theme';

const AVATAR = 52;

// Signed out, sessions live only on this device: a standing invite to an account (Home, Settings), until they sign up.
export function SaveBanner() {
  const { t } = useTranslation();
  const c = useColors();
  const { isSignedIn } = useAuth();
  if (isSignedIn) return null;
  return (
    <Card style={{ borderColor: c.accent, borderWidth: 1.5 }}>
      <View style={styles.row}>
        <DeviceOnly />
        <Txt variant="title" style={styles.who}>
          {t('account.bannerTitle')}
        </Txt>
      </View>
      <Txt variant="caption">{t('account.bannerText')}</Txt>
      <Button label={t('account.bannerCta')} onPress={() => router.push('/account')} style={styles.full} />
    </Card>
  );
}

// A phone with a warning sign on it: the data has no other copy.
function DeviceOnly() {
  const c = useColors();
  return (
    <Svg width={56} height={56} viewBox="0 0 56 56">
      <Rect x={8} y={4} width={28} height={46} rx={6} fill={c.bg3} stroke={c.text2} strokeWidth={2} />
      <Rect x={18} y={9} width={8} height={2} rx={1} fill={c.text2} />
      <Path d="M39 25 L53 50 H25 Z" fill={c.accent} stroke={c.accent} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M39 33 V42" stroke={c.surface} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={39} cy={46.5} r={1.8} fill={c.surface} />
    </Svg>
  );
}

export function AccountCard() {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <SignedIn /> : <SaveBanner />;
}

function SignedIn() {
  const { t } = useTranslation();
  const c = useColors();
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const name = user?.fullName?.trim();

  // The sessions live in the account, so the device forgets them; otherwise the next sign-in would merge them into another account.
  // The app stays open, empty, as a local-only device.
  // If the last sync fails we stay signed in, so nothing unsynced is lost.
  const onSignOut = async () => {
    setBusy(true);
    setError(undefined);
    try {
      if (!(await syncNow(getToken))) return setError(t('account.signOutFailed'));
      await signOut();
      const st = useStore.getState();
      st.setSyncCursor(undefined);
      st.replaceSessions([]);
      router.replace('/');
    } catch {
      setError(t('account.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <Txt variant="label">{t('account.title')}</Txt>
      <View style={styles.row}>
        {user?.hasImage ? (
          <Image source={user.imageUrl} style={styles.avatar} accessibilityIgnoresInvertColors />
        ) : (
          <View style={[styles.avatar, styles.initial, { backgroundColor: c.bg3 }]}>
            <Txt variant="title" style={{ color: c.text2 }}>
              {(name || email).charAt(0).toUpperCase()}
            </Txt>
          </View>
        )}
        <View style={styles.who}>
          {name ? (
            <Txt variant="title" numberOfLines={1}>
              {name}
            </Txt>
          ) : null}
          <Txt numberOfLines={1} style={[styles.email, { color: name ? c.text2 : c.text }]}>
            {email}
          </Txt>
        </View>
      </View>
      <Txt variant="caption">{t('account.syncedText')}</Txt>
      {error && <Txt style={{ color: c.error }}>{error}</Txt>}
      <Button ghost color={c.error} label={busy ? '…' : t('account.signOut')} onPress={onSignOut} disabled={busy} style={styles.full} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3], marginVertical: space[1] },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: radius.pill },
  initial: { alignItems: 'center', justifyContent: 'center' },
  who: { flex: 1, minWidth: 0 },
  email: { fontFamily: fonts.textMedium },
  full: { alignSelf: 'stretch', alignItems: 'center', marginTop: space[2] },
});
