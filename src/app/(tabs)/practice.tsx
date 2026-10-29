import Feather from '@expo/vector-icons/Feather';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TabHead } from '@/components/menu';
import { Art, Button, Card, Choice, Screen, Step, Txt } from '@/components/ui';
import { capture } from '@/lib/analytics';
import { todayMinutes } from '@/lib/practice';
import { clampMinutes, PRESET_MINUTES } from '@/lib/session';
import type { SessionMode } from '@/lib/types';
import { useStore } from '@/store';
import { fonts, radius, space, useColors } from '@/theme';

// Zen by default: the saved practice (free until set up) one tap away; the pill under Begin opens mode and minutes.
export default function Practice() {
  const { t } = useTranslation();
  const c = useColors();
  const sessions = useStore((s) => s.sessions);
  const { program, practice } = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const [custom, setCustom] = useState(false);
  const mode: SessionMode = practice?.mode ?? 'free';
  const min = practice?.min ?? clampMinutes(todayMinutes(sessions, program));
  const setMode = (m: SessionMode) => {
    setSettings({ practice: { mode: m, min } });
    if (m === 'free') setCustom(false); // free is the zen view itself
  };
  const setMin = (m: number) => setSettings({ practice: { mode, min: clampMinutes(m) } });

  // Every return to the tab starts at the zen view; the setup stays saved.
  useFocusEffect(useCallback(() => () => setCustom(false), []));

  // Home's "Change" opens straight into setup. The tab stays mounted, so each tap sends a fresh token to react to.
  const { setup } = useLocalSearchParams<{ setup?: string }>();
  const [seenSetup, setSeenSetup] = useState<string>();
  if (setup && setup !== seenSetup) {
    setSeenSetup(setup);
    setCustom(true);
  }

  const begin = () => {
    capture('session_started', { mode, goal_min: mode === 'free' ? undefined : min, customized: !!practice });
    router.push({ pathname: '/session', params: { mode, min: String(min) } });
  };

  return (
    <Screen>
      <TabHead>
      </TabHead>

      {/* Always the illustration; the words describe the practice Begin starts. */}
      <View style={styles.zen}>
        <Art name="stand" size={custom ? 140 : 260} />
        <Txt variant="display" style={{ textAlign: 'center' }}>
          {mode === 'free' ? t('practice.zenTitle') : `${t(`practice.modes.${mode}`)} · ${min} ${t('practice.min')}`}
        </Txt>
        <Txt variant="caption" style={{ textAlign: 'center' }}>
          {t(`practice.hints.${mode}`)}
        </Txt>
      </View>

      {custom && (
        <Choice
          value={mode}
          onChange={setMode}
          options={(['peak', 'timed', 'free'] as const).map((m) => ({ value: m, label: t(`practice.modes.${m}`) }))}
        />
      )}

      {custom && mode !== 'free' && (
        <>
          <View style={styles.grid}>
            {PRESET_MINUTES.map((m) => {
              const on = m === min;
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

          <Card style={styles.stepper}>
            <Txt variant="body" style={{ flex: 1, color: c.text2 }}>
              {t('practice.custom')}
            </Txt>
            <Step icon="minus" label={t('practice.fewer')} onPress={() => setMin(min - 1)} />
            <Text style={[styles.stepValue, { color: c.text }]}>
              {min} {t('practice.min')}
            </Text>
            <Step icon="plus" label={t('practice.more')} onPress={() => setMin(min + 1)} />
          </Card>
        </>
      )}

      <Button
        label={mode === 'free' ? t('practice.begin') : t('practice.beginFor', { min })}
        onPress={begin}
        style={styles.begin}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => setCustom(!custom)}
        style={({ pressed }) => [styles.setup, { borderColor: c.accent, opacity: pressed ? 0.7 : 1 }]}>
        <Feather name={custom ? 'arrow-left' : 'sliders'} size={18} color={c.accent} />
        <Text style={[styles.setupText, { color: c.accent }]}>{custom ? t('practice.zen') : t('practice.setup')}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
