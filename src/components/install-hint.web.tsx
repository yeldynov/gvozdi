import Feather from '@expo/vector-icons/Feather';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Txt } from '@/components/ui';
import { capture } from '@/lib/analytics';
import { useStore } from '@/store';
import { space, useColors } from '@/theme';

type InstallPrompt = Event & { prompt: () => Promise<void> };
declare global {
  interface Window {
    installPrompt?: InstallPrompt; // captured in +html.tsx before React loads
  }
}

const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
const ios = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Chromium: Install button. iOS Safari: how to add it by hand. Elsewhere, or once installed or dismissed: nothing. */
export function InstallHint() {
  const { t } = useTranslation();
  const c = useColors();
  const dismissed = useStore((s) => s.settings.installHintDismissed);
  const [prompt, setPrompt] = useState(() => window.installPrompt);

  useEffect(() => {
    const onPrompt = (e: Event) => setPrompt(e as InstallPrompt);
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (dismissed || standalone() || (!prompt && !ios())) return null;
  const dismiss = () => useStore.getState().setSettings({ installHintDismissed: true });

  return (
    <Card style={styles.card}>
      <Feather name="download" size={20} color={c.text2} />
      <View style={styles.body}>
        <Txt variant="body">{t('home.install')}</Txt>
        <Txt variant="caption">{prompt ? t('home.installText') : t('home.installIos')}</Txt>
        {prompt && (
          <Button
            ghost
            label={t('home.installButton')}
            onPress={() => {
              capture('install_prompted');
              prompt.prompt().then(() => setPrompt(undefined));
            }}
            style={styles.button}
          />
        )}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} hitSlop={12} onPress={dismiss}>
        <Feather name="x" size={18} color={c.text3} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3], paddingVertical: space[4] },
  body: { flex: 1, gap: space[1] },
  button: { alignSelf: 'flex-start', marginTop: space[2] },
});
