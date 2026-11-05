/* Hallmark · redesign: full · shape: app screen · scope: app · system: locked (DESIGN.md) + useColors() per skin */
/* Hallmark · dropped sliders · the Step icon of the old setup toggle; Timed now shows its options directly */
/* Hallmark · dropped onPress={() => save({ peak: !peak })}, onPress={() => save({ free: !free })}, onPress={() => setCustom(false)}, onPress={() => setCustom(true)}, onPress={() => setMin(m)}, onPress={() => setMin(min + 1)}, onPress={() => setMin(min - 1)} · the old preset tiles, No limit checkbox, rail ∞ end and gear/✕ setup toggle gave way to a Free | Timed segmented choice on top, presets plus a typed minutes field with −/+ steps instead of the rail, Peak guidance in Settings, at the owner's request */
/* Hallmark · answered 26a · the focus ring is global, in src/app/+html.tsx ([tabindex]:focus-visible, theme colour via --focus) */
/* Hallmark · answered 26b · pressed = opacity on every Pressable; no disabled controls on this screen */
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { TabHead } from '@/components/menu';
import { Art, Button, Card, Choice, Screen, Step, Txt } from '@/components/ui';
import { capture } from '@/lib/analytics';
import { todayMinutes } from '@/lib/practice';
import { clampMinutes, MAX_MINUTES, PRESET_MINUTES, stepMinutes } from '@/lib/session';
import type { SessionMode } from '@/lib/types';
import { useStore } from '@/store';
import { fonts, radius, space, useColors, useSkin } from '@/theme';

// Two kinds of practice, chosen on top: Free has nothing to set; Timed shows its length. Peak guidance lives in Settings.
export default function Practice() {
  const { t } = useTranslation();
  const herb = useSkin() === 'herbarium';
  const Group = herb ? View : Card;
  const sessions = useStore((s) => s.sessions);
  const { program, practice } = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const free = practice?.free ?? true;
  const peak = practice?.peak ?? false; // set in Settings, guides Free and Timed alike
  const min = practice?.min ?? clampMinutes(todayMinutes(sessions, program));
  const mode: SessionMode = peak ? 'peak' : free ? 'free' : 'timed';
  const save = (next: Partial<{ free: boolean; peak: boolean; min: number }>) => setSettings({ practice: { free, peak, min, ...next } });

  // Home's "Change" lands on Timed, where the options are. The tab stays mounted, so each tap sends a fresh token to react to.
  const { setup } = useLocalSearchParams<{ setup?: string }>();
  const [seenSetup, setSeenSetup] = useState<string>();
  if (setup && setup !== seenSetup) {
    setSeenSetup(setup);
    if (free) save({ free: false });
  }

  const begin = () => {
    capture('session_started', { mode, goal_min: free ? undefined : min, customized: !free });
    router.push({ pathname: '/session', params: { mode, min: free ? '0' : String(min) } });
  };

  // Herbarium puts all of this on one sheet.
  const body = (
    <>
      <Choice
        value={free ? 'free' : 'timed'}
        options={[
          { value: 'free', label: t('practice.modes.free') },
          { value: 'timed', label: t('practice.modes.timed') },
        ]}
        onChange={(v) => save({ free: v === 'free' })}
      />

      <View style={[styles.zen, herb && { paddingVertical: 0 }]}>
        <Art name="stand" size={free ? 260 : 150} />
        <Txt variant="display" style={{ textAlign: 'center' }}>
          {mode === 'free' ? t('practice.zenTitle') : t(`practice.modes.${mode}`)}
        </Txt>
        {free && (
          <Txt variant="caption" style={{ textAlign: 'center' }}>
            {t(`practice.hints.${mode}`)}
          </Txt>
        )}
      </View>

      {!free && (
        // One grouped list on the sheet (herbarium) or one card (other skins): the length, as a preset or typed.
        <Group style={herb ? styles.groupFlat : styles.group}>
          <View style={styles.row}>
            <Txt variant="body" style={styles.rowLabel}>
              {t('practice.length')}
            </Txt>
            <MinutesField value={min} onChange={(m) => save({ min: m })} />
          </View>
          <Choice
            value={String(min)}
            options={PRESET_MINUTES.map((m) => ({ value: String(m), label: String(m) }))}
            onChange={(v) => save({ min: Number(v) })}
          />
        </Group>
      )}

      <Button label={free ? t('practice.begin') : t('practice.beginFor', { min })} onPress={begin} style={styles.begin} />
    </>
  );

  return (
    <Screen>
      <TabHead />

      {herb ? <Card style={styles.sheet}>{body}</Card> : body}
    </Screen>
  );
}

// Any length the presets don't offer: type the minutes, 1 to 90. Saves as you type; leaving the field shows the saved value.
function MinutesField({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  const { t } = useTranslation();
  const c = useColors();
  const [text, setText] = useState<string>(); // set while typing
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  return (
    <View style={styles.field}>
      <Step icon="minus" label={t('practice.fewer')} onPress={() => onChange(stepMinutes(value, -1))} disabled={value <= 1} />
      {/* One box holds the number and its unit; a tap anywhere in it types. */}
      <Pressable onPress={() => input.current?.focus()} style={[styles.box, text === undefined ? { borderColor: c.divider } : { borderColor: c.primary, borderWidth: 1.5 }]}>
        <TextInput
          ref={input}
          accessibilityLabel={t('practice.length')}
          value={text ?? String(value)}
          onFocus={() => setText(String(value))}
          onChangeText={(v) => {
            const digits = v.replace(/\D/g, '').slice(0, 2);
            setText(digits);
            if (Number(digits) >= 1) onChange(clampMinutes(Number(digits)));
          }}
          onBlur={() => setText(undefined)}
          keyboardType="number-pad"
          inputMode="numeric"
          returnKeyType="done"
          selectTextOnFocus
          maxLength={2}
          style={[styles.input, { color: c.text }]}
        />
        <Txt variant="caption">{t('practice.min')}</Txt>
      </Pressable>
      <Step icon="plus" label={t('practice.more')} onPress={() => onChange(stepMinutes(value, 1))} disabled={value >= MAX_MINUTES} />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[3], paddingTop: space[2], paddingBottom: space[4] },
  groupFlat: { gap: space[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3], minHeight: 44 },
  rowLabel: { flex: 1, gap: 2 },
  sheet: { gap: space[4], paddingVertical: space[6] },
  zen: { alignItems: 'center', gap: space[3], paddingVertical: space[4] },
  field: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  box: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: space[1], minWidth: 84, paddingVertical: space[2], paddingHorizontal: space[3], borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.sm },
  input: { width: 28, padding: 0, textAlign: 'right', fontFamily: fonts.textMedium, fontSize: 18, fontVariant: ['tabular-nums'], outlineStyle: 'none' } as object,
  // The one action: full width, taller than other buttons (DESIGN.md: Begin is full-width as the sheet's main action).
  begin: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', minHeight: 60, marginTop: space[3] },
});
