// Signed-in account card (Settings, /account): avatar + name when the provider gave them, email, sign out.
import { useAuth, useUser } from '@clerk/expo';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Txt } from '@/components/ui';
import { syncNow } from '@/lib/sync';
import { useStore } from '@/store';
import { fonts, radius, space, useColors } from '@/theme';

const AVATAR = 52;

export function AccountCard() {
  const { t } = useTranslation();
  const c = useColors();
  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const name = user?.fullName?.trim();

  // The sessions live in the account, so the device forgets them; otherwise the next sign-in would merge them into another account.
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
      router.replace('/onboarding');
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
