import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AccountCard } from '@/components/account-card';
import { TabHead, WriteToUs } from '@/components/menu';
import { Button, Card, Choice, Screen, Sheet, Step, Txt } from '@/components/ui';
import { mergeSessions, parseBackup, serializeBackup } from '@/lib/backup';
import { exportBackup, pickBackup } from '@/lib/backup-io';
import { dayKey, live, shiftTime } from '@/lib/practice';
import { allowReminders, remindersSupported } from '@/lib/reminder';
import type { Language, ThemePref } from '@/lib/types';
import { useStore } from '@/store';
import { space, useColors } from '@/theme';

export default function Settings() {
  const { t } = useTranslation();
  const c = useColors();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const [notice, setNotice] = useState<{ text: string; error?: boolean }>();
  const [confirming, setConfirming] = useState(false);

  const onExport = () => {
    const { sessions } = useStore.getState();
    exportBackup(serializeBackup(sessions), `gvozdi-${dayKey(new Date())}.json`).catch(() =>
      setNotice({ text: t('settings.exportFailed'), error: true }),
    );
  };

  const onImport = async () => {
    const text = await pickBackup().catch(() => null);
    if (text == null) return;
    try {
      const incoming = parseBackup(text);
      const { sessions, replaceSessions } = useStore.getState();
      replaceSessions(mergeSessions(sessions, incoming));
      setNotice({ text: t('settings.imported', { count: live(incoming).length }) });
    } catch {
      setNotice({ text: t('settings.importFailed'), error: true });
    }
  };

  const onReminder = async (on: 'on' | 'off') => {
    if (on === 'off') return setSettings({ reminder: undefined });
    if (await allowReminders()) setSettings({ reminder: '20:00' });
    else setNotice({ text: t('settings.reminderDenied'), error: true });
  };
  const shiftReminder = (delta: number) => settings.reminder && setSettings({ reminder: shiftTime(settings.reminder, delta) });

  const onClear = () => {
    setConfirming(false);
    useStore.getState().clearSessions();
    setNotice({ text: t('settings.cleared') });
  };

  return (
    <Screen>
      <TabHead />
      <AccountCard />
      <Card>
        <Txt variant="label">{t('settings.language')}</Txt>
        <Choice<Language>
          value={settings.language}
          onChange={(language) => setSettings({ language })}
          options={[
            { value: 'system', label: t('settings.auto') },
            { value: 'en', label: t('settings.langEn') },
            { value: 'uk', label: t('settings.langUk') },
            { value: 'ru', label: t('settings.langRu') },
          ]}
        />
      </Card>
      <Card>
        <Txt variant="label">{t('settings.theme')}</Txt>
        <Choice<ThemePref>
          value={settings.theme}
          onChange={(theme) => setSettings({ theme })}
          options={[
            { value: 'system', label: t('settings.auto') },
            { value: 'light', label: t('settings.light') },
            { value: 'dark', label: t('settings.dark') },
          ]}
        />
      </Card>
      <Card>
        <Txt variant="label">{t('settings.reminder')}</Txt>
        <Txt variant="caption">{t(remindersSupported ? 'settings.reminderText' : 'settings.reminderWeb')}</Txt>
        {remindersSupported && (
          <Choice<'on' | 'off'>
            value={settings.reminder ? 'on' : 'off'}
            onChange={onReminder}
            options={[
              { value: 'off', label: t('settings.off') },
              { value: 'on', label: t('settings.on') },
            ]}
          />
        )}
        {remindersSupported && settings.reminder && (
          <View style={styles.time}>
            <Step icon="minus" label={t('settings.earlier')} onPress={() => shiftReminder(-15)} />
            <Txt variant="title" style={styles.timeValue}>
              {settings.reminder}
            </Txt>
            <Step icon="plus" label={t('settings.later')} onPress={() => shiftReminder(15)} />
          </View>
        )}
      </Card>
      <Card>
        <Txt variant="label">{t('settings.prepare')}</Txt>
        <Txt variant="caption">{t('settings.prepareText')}</Txt>
        <Choice<'on' | 'off'>
          value={settings.skipPrepare ? 'off' : 'on'}
          onChange={(v) => setSettings({ skipPrepare: v === 'off' })}
          options={[
            { value: 'off', label: t('settings.off') },
            { value: 'on', label: t('settings.on') },
          ]}
        />
      </Card>
      <Card>
        <Txt variant="label">{t('settings.privacy')}</Txt>
        <Txt variant="caption">{t('settings.privacyText')}</Txt>
        <Choice<'on' | 'off'>
          value={settings.analytics ? 'on' : 'off'}
          onChange={(v) => setSettings(v === 'on' ? { analytics: true } : { analytics: false })}
          options={[
            { value: 'off', label: t('settings.off') },
            { value: 'on', label: t('settings.on') },
          ]}
        />
      </Card>
      <Card>
        <Txt variant="label">{t('settings.data')}</Txt>
        <Txt variant="caption">{t('settings.dataTextSynced')}</Txt>
        <View style={styles.row}>
          <Button ghost label={t('settings.export')} onPress={onExport} style={styles.half} />
          <Button ghost label={t('settings.import')} onPress={onImport} style={styles.half} />
        </View>
        <Button ghost label={t('settings.clear')} onPress={() => setConfirming(true)} style={styles.full} />
        {notice && <Txt style={{ color: notice.error ? c.error : c.success }}>{notice.text}</Txt>}
      </Card>
      <Card>
        <Txt variant="label">{t('settings.contact')}</Txt>
        <Txt variant="caption">{t('settings.contactText')}</Txt>
        <WriteToUs style={styles.full} />
      </Card>
      <Txt variant="caption" style={{ textAlign: 'center' }}>
        {t('settings.version', { version: Constants.expoConfig?.version })}
        {process.env.EXPO_PUBLIC_BUILD && ` (${process.env.EXPO_PUBLIC_BUILD})`}
      </Txt>

      <Sheet visible={confirming} onClose={() => setConfirming(false)}>
        <Txt variant="title">{t('settings.clearTitle')}</Txt>
        <Txt style={{ color: c.text2 }}>{t('settings.clearText')}</Txt>
        <View style={styles.row}>
          <Button ghost label={t('common.cancel')} onPress={() => setConfirming(false)} style={styles.half} />
          <Button label={t('settings.clearConfirm')} onPress={onClear} style={[styles.half, { backgroundColor: c.error }]} />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space[3], marginTop: space[2] },
  half: { flex: 1, alignItems: 'center', paddingHorizontal: space[2] },
  time: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[4], marginTop: space[2] },
  timeValue: { minWidth: 80, textAlign: 'center', fontVariant: ['tabular-nums'] },
  full: { alignSelf: 'stretch', alignItems: 'center' },
});
