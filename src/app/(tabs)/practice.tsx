import Feather from '@expo/vector-icons/Feather';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TabHead } from '@/components/menu';
import { Art, Button, Card, Screen, Step, Txt } from '@/components/ui';
import { capture } from '@/lib/analytics';
import { todayMinutes } from '@/lib/practice';
import { clampMinutes, PRESET_MINUTES } from '@/lib/session';
import type { SessionMode } from '@/lib/types';
import { useStore } from '@/store';
import { fonts, herbFonts, radius, space, useColors, useSkin } from '@/theme';

// One view of the saved practice (free until set up); the pill under Begin opens its options.
export default function Practice() {
  const { t } = useTranslation();
  const c = useColors();
  const herb = useSkin() === 'herbarium';
  const Stepper = herb ? View : Card;
  const sessions = useStore((s) => s.sessions);
  const { program, practice } = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const [custom, setCustom] = useState(false);
  // Two independent answers: how long (minutes or no limit) and whether to guide the peak.
  const free = practice?.free ?? true;
  const peak = practice?.peak ?? false;
  const min = practice?.min ?? clampMinutes(todayMinutes(sessions, program));
  const mode: SessionMode = peak ? 'peak' : free ? 'free' : 'timed';
  const save = (next: Partial<{ free: boolean; peak: boolean; min: number }>) => setSettings({ practice: { free, peak, min, ...next } });
  const setMin = (m: number) => save({ free: false, min: clampMinutes(m) });

  // Every return to the tab starts with the options folded; the setup stays saved.
  useFocusEffect(useCallback(() => () => setCustom(false), []));

  // Home's "Change" opens straight into setup. The tab stays mounted, so each tap sends a fresh token to react to.
  const { setup } = useLocalSearchParams<{ setup?: string }>();
  const [seenSetup, setSeenSetup] = useState<string>();
  if (setup && setup !== seenSetup) {
    setSeenSetup(setup);
    setCustom(true);
  }

  const begin = () => {
    capture('session_started', { mode, goal_min: free ? undefined : min, customized: custom });
    router.push({ pathname: '/session', params: { mode, min: free ? '0' : String(min) } });
  };

  // Herbarium puts all of this on one sheet.
  const body = (
    <>
      {/* Always the illustration; the words describe the practice Begin starts. */}
      <View style={[styles.zen, herb && { paddingVertical: 0 }]}>
        {/* Folds the options without starting; Begin stays the only big action. */}
        {custom && (
          <View style={styles.close}>
            <Step icon="x" label={t('common.close')} onPress={() => setCustom(false)} />
          </View>
        )}
        <Art name="stand" size={custom ? 140 : 260} />
        <Txt variant="display" style={{ textAlign: 'center' }}>
          {mode === 'free' ? t('practice.zenTitle') : `${t(`practice.modes.${mode}`)} · ${free ? t('practice.freeOption') : `${min} ${t('practice.min')}`}`}
        </Txt>
        <Txt variant="caption" style={{ textAlign: 'center' }}>
          {t(`practice.hints.${mode}`)}
        </Txt>
      </View>

      {custom && (
        <>
          {/* Two independent options first, each saying what it does. */}
          <Check label={t('practice.peakOption')} info={t('practice.peakInfo')} on={peak} onPress={() => save({ peak: !peak })} />
          <Check label={t('practice.freeOption')} info={t('practice.freeInfo')} on={free} onPress={() => save({ free: !free })} />

          {/* No limit: the minutes stay visible but out of reach. */}
          <View style={[styles.minutes, free && styles.off]} pointerEvents={free ? 'none' : 'auto'} aria-disabled={free}>
            <View style={styles.grid}>
              {PRESET_MINUTES.map((m) => {
                const on = !free && m === min;
                return (
                  <Pressable
                    key={m}
                    accessibilityRole="radio"
                    aria-checked={on}
                    accessibilityLabel={`${m} ${t('practice.min')}`}
                    onPress={() => setMin(m)}
                    style={[styles.tile, { backgroundColor: on ? c.primary : c.bg2 }]}>
                    <Text style={[styles.tileNum, { color: on ? c.onPrimary : c.text }]}>{m}</Text>
                    <Text style={[styles.tileUnit, { color: on ? c.onPrimary : c.text2 }]}>{t('practice.min')}</Text>
                  </Pressable>
                );
              })}
            </View>
  
            <Stepper style={{ ...styles.stepper, ...(herb && { paddingVertical: 0 }) }}>
              <Txt variant="body" style={{ flex: 1, color: c.text2 }}>
                {t('practice.custom')}
              </Txt>
              <Step icon="minus" label={t('practice.fewer')} onPress={() => setMin(min - 1)} />
              <Text style={[styles.stepValue, { color: c.text }]}>
                {min} {t('practice.min')}
              </Text>
              <Step icon="plus" label={t('practice.more')} onPress={() => setMin(min + 1)} />
            </Stepper>
          </View>        </>
      )}

      <Button
        label={free ? t('practice.begin') : t('practice.beginFor', { min })}
        onPress={begin}
        style={[styles.begin, herb && { marginTop: 0 }]}
      />
    </>
  );

  return (
    <Screen>
      <TabHead />

      {herb ? <Card style={styles.sheet}>{body}</Card> : body}
      {/* Open setup has one action, Begin; leaving the tab folds it again. */}
      {!custom && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setCustom(true)}
          style={({ pressed }) => [
            styles.setup,
            herb ? { borderWidth: 0, minHeight: 44, backgroundColor: c.bg2, opacity: pressed ? 0.85 : 1 } : { borderColor: c.accent, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Feather name="sliders" size={18} color={herb ? c.text : c.accent} />
          <Text style={[styles.setupText, herb && { fontFamily: herbFonts.textMedium }, { color: herb ? c.text : c.accent }]}>{t('practice.setup')}</Text>
        </Pressable>
      )}
    </Screen>
  );
}

function Check({ label, info, on, onPress }: { label: string; info?: string; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={on}
      onPress={onPress}
      style={({ pressed }) => [styles.check, { backgroundColor: c.bg2, opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.box, on ? { backgroundColor: c.primary, borderColor: c.primary } : { borderColor: c.text2 }]}>
        {on && <Feather name="check" size={16} color={c.onPrimary} />}
      </View>
      <View style={{ flex: 1, gap: space[1] }}>
        <Txt variant="body">{label}</Txt>
        {info && <Txt variant="caption">{info}</Txt>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  check: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3], padding: space[4], borderRadius: radius.md },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  off: { opacity: 0.35 },
  minutes: { gap: space[4] },
  close: { position: 'absolute', top: 0, right: 0, zIndex: 1 },
  sheet: { gap: space[4], paddingVertical: space[6] },
  zen: { alignItems: 'center', gap: space[3], paddingVertical: space[4] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  tile: { flexBasis: '31%', flexGrow: 1, alignItems: 'center', paddingVertical: space[4], borderRadius: radius.md },
  tileNum: { fontFamily: fonts.textMedium, fontSize: 22, fontVariant: ['tabular-nums'] },
  tileUnit: { fontFamily: fonts.text, fontSize: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[3] },
  stepValue: { fontFamily: fonts.textMedium, fontSize: 16, minWidth: 64, textAlign: 'center', fontVariant: ['tabular-nums'] },
  begin: { alignSelf: 'stretch', alignItems: 'center', marginTop: space[2] },
  setup: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: space[2],
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingVertical: space[2],
    paddingHorizontal: space[5],
  },
  setupText: { fontFamily: fonts.textMedium, fontSize: 15 },
});
