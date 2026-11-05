import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccountCard } from '@/components/account-card';
import { TabHead, WriteToUs } from '@/components/menu';
import { Tree } from '@/components/progress-visuals';
import { Button, Card, Choice, Screen, Sheet, Step, Txt } from '@/components/ui';
import { mergeSessions, parseBackup, serializeBackup } from '@/lib/backup';
import { exportBackup, pickBackup } from '@/lib/backup-io';
import { dayKey, live, shiftTime, todayMinutes } from '@/lib/practice';
import { clampMinutes } from '@/lib/session';
import { allowReminders, openNotificationSettings, remindersSupported } from '@/lib/reminder';
import type { Language, Skin, ThemePref } from '@/lib/types';
import { Tree as HerbTree } from '@/skins/herbarium/progress-visuals';
import { useStore } from '@/store';
import { fonts, herbFonts, inkFonts, palette, radius, space, useColors, type Colors } from '@/theme';

export default function Settings() {
  const { t } = useTranslation();
  const c = useColors();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const [notice, setNotice] = useState<{ text: string; error?: boolean }>();
  const [confirming, setConfirming] = useState(false);
  const [denied, setDenied] = useState(false);
  // Theme and skin repaint every mounted screen, which takes a moment on Android: mark the choice first, apply it a frame later.
  const [pending, setPending] = useState<{ theme?: ThemePref; skin?: Skin }>({});
  const choose = (patch: { theme?: ThemePref; skin?: Skin }) => {
    setPending(patch);
    requestAnimationFrame(() =>
      setTimeout(() => {
        setSettings(patch);
        setPending({});
      }),
    );
  };

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

  const onReminder = async (on: boolean) => {
    if (!on) return setSettings({ reminder: undefined });
    const ok = await allowReminders();
    setDenied(!ok);
    if (ok) setSettings({ reminder: '20:00' });
  };
  const shiftReminder = (delta: number) => settings.reminder && setSettings({ reminder: shiftTime(settings.reminder, delta) });

  // Peak guidance is part of the saved practice; an unset practice starts as Free at today's suggested length.
  const onPeak = (peak: boolean) =>
    setSettings({ practice: { free: true, min: clampMinutes(todayMinutes(useStore.getState().sessions, settings.program)), ...settings.practice, peak } });

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
          value={pending.theme ?? settings.theme}
          onChange={(theme) => choose({ theme })}
          options={[
            { value: 'system', label: t('settings.auto') },
            { value: 'light', label: t('settings.light') },
            { value: 'dark', label: t('settings.dark') },
          ]}
        />
        <View accessibilityRole="radiogroup" style={styles.skins}>
          {(['earthy', 'herbarium', 'ink', 'dusk'] as const).map((skin) => (
            <SkinTile key={skin} skin={skin} on={(pending.skin ?? settings.skin ?? 'earthy') === skin} onPress={() => choose({ skin })} />
          ))}
        </View>
      </Card>
      <Card>
        <Txt variant="label">{t('settings.reminder')}</Txt>
        <Txt variant="caption">{t(remindersSupported ? 'settings.reminderText' : 'settings.reminderWeb')}</Txt>
        {remindersSupported && (
          <OnOff value={!!settings.reminder} onChange={onReminder} />
        )}
        {denied && (
          <>
            <Txt variant="caption" style={{ color: c.error }}>
              {t('settings.reminderDenied')}
            </Txt>
            <Button ghost label={t('settings.openSettings')} onPress={openNotificationSettings} />
          </>
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
        <OnOff value={!settings.skipPrepare} onChange={(on) => setSettings({ skipPrepare: !on })} />
      </Card>
      <Card>
        <Txt variant="label">{t('practice.peakOption')}</Txt>
        <Txt variant="caption">{t('practice.peakInfo')}</Txt>
        <OnOff value={!!settings.practice?.peak} onChange={onPeak} />
      </Card>
      <Card>
        <Txt variant="label">{t('settings.privacy')}</Txt>
        <Txt variant="caption">{t('settings.privacyText')}</Txt>
        <OnOff value={!!settings.analytics} onChange={(analytics) => setSettings({ analytics })} />
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

function OnOff({ value, onChange }: { value: boolean; onChange: (on: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <Choice
      value={value ? 'on' : 'off'}
      onChange={(v) => onChange(v === 'on')}
      options={[
        { value: 'off', label: t('settings.off') },
        { value: 'on', label: t('settings.on') },
      ]}
    />
  );
}

/** Blend two #rrggbb colors: `t` of `b` over `a`. */
const mix = (a: string, b: string, t: number) =>
  `#${[1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('')}`;

/** A skin previewed in its own colors, font and tree, whichever skin is active. */
function SkinTile({ skin, on, onPress }: { skin: Skin; on: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const k = palette(skin, useColors().isDark);
  const herb = skin === 'herbarium';
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={on}
      accessibilityLabel={t(`settings.${skin}`)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.skin,
        { backgroundColor: TILE_TINT[skin](k), borderColor: on ? k.primary : k.divider, borderWidth: on ? 2 : 1, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View aria-hidden style={styles.skinTree}>
        {herb ? <HerbTree stage={8} size={110} /> : <Tree stage={8} size={110} skin={skin} />}
      </View>
      {herb && (
        <View style={[styles.eco, { backgroundColor: k.primary }]}>
          <Text style={[styles.ecoText, { color: k.onPrimary }]}>{t('settings.eco')}</Text>
        </View>
      )}
      <Text style={[styles.skinName, { color: k.text, fontFamily: skin === 'herbarium' ? herbFonts.textMedium : skin === 'ink' ? inkFonts.display : fonts.display }]}>{t(`settings.${skin}`)}</Text>
    </Pressable>
  );
}

const TILE_TINT: Record<Skin, (k: Colors) => string> = {
  earthy: (k) => mix(k.bg3, k.illus, 0.25),
  herbarium: (k) => mix(k.bg3, k.primary, 0.18),
  ink: (k) => k.bg,
  dusk: (k) => mix(k.bg3, k.accent, 0.12),
};

const styles = StyleSheet.create({
  skins: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3], marginTop: space[2] },
  skin: { flexGrow: 1, flexBasis: '40%', height: 140, borderRadius: radius.md, padding: space[3], justifyContent: 'flex-end', overflow: 'hidden' },
  skinTree: { position: 'absolute', right: -14, bottom: -8 },
  skinName: { fontSize: 18 },
  eco: { position: 'absolute', top: space[3], left: space[3], borderRadius: radius.pill, paddingHorizontal: space[2], paddingVertical: 2 },
  ecoText: { fontFamily: herbFonts.textBold, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: space[3], marginTop: space[2] },
  half: { flex: 1, alignItems: 'center', paddingHorizontal: space[2] },
  time: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space[4], marginTop: space[2] },
  timeValue: { minWidth: 80, textAlign: 'center', fontVariant: ['tabular-nums'] },
  full: { alignSelf: 'stretch', alignItems: 'center' },
});
