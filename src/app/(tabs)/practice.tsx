import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
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

// Zen by default: a free session one tap away; the pill under Begin opens mode and minutes.
// ponytail: mode and minutes reset per visit; persist a last-used choice in settings if people ask
export default function Practice() {
  const { t } = useTranslation();
  const c = useColors();
  const sessions = useStore((s) => s.sessions);
  const [custom, setCustom] = useState(false);
  const [mode, setMode] = useState<SessionMode>('free');
  const program = useStore((s) => s.settings.program);
  const [min, setMin] = useState(() => clampMinutes(todayMinutes(sessions, program)));

  const toggle = () => {
    setCustom(!custom);
    setMode(custom ? 'free' : 'peak');
  };

  const begin = () => {
    capture('session_started', { mode, goal_min: mode === 'free' ? undefined : min, customized: custom });
    router.push({ pathname: '/session', params: { mode, min: String(min) } });
  };

  return (
    <Screen>
      <TabHead>
      </TabHead>

      {!custom && (
        <View style={styles.zen}>
          <Art name="stand" size={260} />
          <Txt variant="display" style={{ textAlign: 'center' }}>
            {t('practice.zenTitle')}
          </Txt>
          <Txt variant="caption" style={{ textAlign: 'center' }}>
            {t('practice.hints.free')}
          </Txt>
        </View>
      )}

      {custom && (
        <>
          <Txt variant="display">{t('practice.question')}</Txt>

          <Choice
            value={mode}
            onChange={setMode}
            options={(['peak', 'timed', 'free'] as const).map((m) => ({ value: m, label: t(`practice.modes.${m}`) }))}
          />
          <Txt variant="caption">{t(`practice.hints.${mode}`)}</Txt>
        </>
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
            <Step icon="minus" label={t('practice.fewer')} onPress={() => setMin((m) => clampMinutes(m - 1))} />
            <Text style={[styles.stepValue, { color: c.text }]}>
              {min} {t('practice.min')}
            </Text>
            <Step icon="plus" label={t('practice.more')} onPress={() => setMin((m) => clampMinutes(m + 1))} />
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
        onPress={toggle}
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
